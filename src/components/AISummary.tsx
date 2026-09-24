import {
    cloneElement,
    Fragment,
    isValidElement,
    type ReactNode,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
// Rspress exposes this runtime subpath as ESM, while the plugin is emitted as CJS.
// @ts-ignore
import { useLang } from '@rspress/core/runtime';
import { FiChevronDown } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { BorderBeam } from './BorderBeam';
import './AISummary.css';

export interface AISummaryProps {
    children: ReactNode;
    title?: string;
}

const summaryCopy = {
    zh: {
        title: 'AI 总结',
        badge: 'AI 生成',
        generating: '生成中',
        expand: '展开',
        collapse: '收起',
        ariaLabel: 'AI 生成的内容总结',
    },
    en: {
        title: 'AI Summary',
        badge: 'AI Generated',
        generating: 'Generating',
        expand: 'Expand',
        collapse: 'Collapse',
        ariaLabel: 'AI-generated content summary',
    },
};

function getTextLength(node: ReactNode): number {
    if (typeof node === 'string' || typeof node === 'number') {
        return Array.from(String(node)).length;
    }

    if (Array.isArray(node)) {
        return node.reduce((total, child) => total + getTextLength(child), 0);
    }

    if (isValidElement<{ children?: ReactNode }>(node)) {
        return getTextLength(node.props.children);
    }

    return 0;
}

function getTextContent(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }

    if (Array.isArray(node)) {
        return node.map(getTextContent).join('');
    }

    if (isValidElement<{ children?: ReactNode }>(node)) {
        return getTextContent(node.props.children);
    }

    return '';
}

function revealText(
    node: ReactNode,
    budget: { remaining: number },
    cursor: ReactNode,
    cursorState: { inserted: boolean },
): ReactNode {
    if (budget.remaining <= 0) {
        return null;
    }

    if (typeof node === 'string' || typeof node === 'number') {
        const characters = Array.from(String(node));
        const visibleText = characters.slice(0, budget.remaining).join('');
        budget.remaining -= characters.length;

        if (!cursorState.inserted && budget.remaining <= 0) {
            cursorState.inserted = true;
            return (
                <Fragment>
                    {visibleText}
                    {cursor}
                </Fragment>
            );
        }

        return visibleText;
    }

    if (Array.isArray(node)) {
        return node.map((child, index) => (
            <Fragment key={index}>
                {revealText(child, budget, cursor, cursorState)}
            </Fragment>
        ));
    }

    if (isValidElement<{ children?: ReactNode }>(node)) {
        const nextChildren = revealText(node.props.children, budget, cursor, cursorState);
        return nextChildren === null ? null : cloneElement(node, undefined, nextChildren);
    }

    return node;
}

export function AISummary({children, title}: AISummaryProps) {
    const locale = useLang()?.toLowerCase().startsWith('en') ? 'en' : 'zh';
    const copy = summaryCopy[locale];
    const resolvedTitle = title || copy.title;
    const contentId = useId();
    const summaryRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const collapseMeasureRef = useRef<HTMLSpanElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [canCollapse, setCanCollapse] = useState(false);
    const [hasReachedCollapseLimit, setHasReachedCollapseLimit] = useState(false);
    const [visibleLength, setVisibleLength] = useState(() => getTextLength(children));
    const [hovered, setHovered] = useState(false);
    const totalLength = useMemo(() => getTextLength(children), [children]);
    const accessibleContent = useMemo(() => getTextContent(children), [children]);
    const isCollapsed = canCollapse && !expanded;
    const showToggle = canCollapse && (!isTyping || hasReachedCollapseLimit);

    const measureContent = useCallback(() => {
        const contentElement = contentRef.current;
        const collapseMeasureElement = collapseMeasureRef.current;
        if (!contentElement || !collapseMeasureElement) {
            return;
        }

        const collapseHeight = collapseMeasureElement.getBoundingClientRect().height;
        const contentHeight = contentElement.scrollHeight;
        const overflowsCollapseHeight = contentHeight > collapseHeight + 1;

        setCanCollapse(overflowsCollapseHeight);
        if (isTyping && overflowsCollapseHeight) {
            setHasReachedCollapseLimit(true);
        }
    }, [isTyping]);

    useEffect(() => {
        measureContent();
    }, [measureContent, visibleLength]);

    useEffect(() => {
        const summaryElement = summaryRef.current;
        if (!summaryElement) {
            return;
        }

        let animationFrame = 0;
        const scheduleMeasurement = () => {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = window.requestAnimationFrame(measureContent);
        };

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', scheduleMeasurement);
            return () => {
                window.removeEventListener('resize', scheduleMeasurement);
                window.cancelAnimationFrame(animationFrame);
            };
        }

        const observer = new ResizeObserver(scheduleMeasurement);

        observer.observe(summaryElement);
        if (contentRef.current) {
            observer.observe(contentRef.current);
        }

        return () => {
            observer.disconnect();
            window.cancelAnimationFrame(animationFrame);
        };
    }, [measureContent]);

    useEffect(() => {
        const summaryElement = summaryRef.current;
        if (!summaryElement || totalLength === 0) {
            return;
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            setVisibleLength(totalLength);
            return;
        }

        let animationFrame = 0;
        let observer: IntersectionObserver | undefined;

        const startTyping = () => {
            const duration = Math.min(5000, Math.max(1400, totalLength * 10));
            const startedAt = performance.now();

            setVisibleLength(0);
            setHasReachedCollapseLimit(false);
            setIsTyping(true);

            const animate = (timestamp: number) => {
                const progress = Math.min(1, (timestamp - startedAt) / duration);
                const easedProgress = 1 - Math.pow(1 - progress, 1.8);

                setVisibleLength(Math.max(1, Math.round(totalLength * easedProgress)));

                if (progress < 1) {
                    animationFrame = window.requestAnimationFrame(animate);
                    return;
                }

                setVisibleLength(totalLength);
                setIsTyping(false);
            };

            animationFrame = window.requestAnimationFrame(animate);
        };

        if (typeof IntersectionObserver === 'undefined') {
            startTyping();
        } else {
            observer = new IntersectionObserver(
                ([entry]) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    observer?.disconnect();
                    startTyping();
                },
                {threshold: 0.15},
            );
            observer.observe(summaryElement);
        }

        return () => {
            observer?.disconnect();
            window.cancelAnimationFrame(animationFrame);
        };
    }, [totalLength]);

    const revealedContent = useMemo(() => {
        const budget = {remaining: visibleLength};
        const cursorState = {inserted: false};
        const cursor = <span className="ai-summary__cursor" aria-hidden="true"/>;
        return revealText(children, budget, cursor, cursorState);
    }, [children, visibleLength]);

    return (
        <div
            role="note"
            ref={summaryRef}
            aria-label={title || copy.ariaLabel}
            aria-busy={isTyping}
            className={[
                'ai-summary',
                isTyping ? 'ai-summary--typing' : '',
                isCollapsed ? 'ai-summary--collapsed' : '',
            ].filter(Boolean).join(' ')}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <span
                ref={collapseMeasureRef}
                className="ai-summary__collapse-measure"
                aria-hidden="true"
            />
            <div className="ai-summary__inner">
                <div className="ai-summary__header">
                    <span className="ai-summary__icon" aria-hidden="true">
                        <HiSparkles/>
                    </span>
                    <span className="ai-summary__title">{resolvedTitle}</span>
                    <span className="ai-summary__badge">
                        {isTyping ? copy.generating : copy.badge}
                    </span>
                </div>
                <div className="ai-summary__body">
                    <div className="ai-summary__content-shell">
                        {(isTyping || isCollapsed) && (
                            <div className="ai-summary__screen-reader-content">
                                {accessibleContent}
                            </div>
                        )}
                        <div
                            ref={contentRef}
                            id={contentId}
                            className="ai-summary__content"
                            aria-hidden={isTyping || isCollapsed || undefined}
                            inert={isTyping || isCollapsed || undefined}
                        >
                            {isTyping ? revealedContent : children}
                        </div>
                    </div>
                    {showToggle && (
                        <div className="ai-summary__actions">
                            <button
                                type="button"
                                className="ai-summary__toggle"
                                aria-controls={contentId}
                                aria-expanded={expanded}
                                onClick={() => setExpanded((current) => !current)}
                            >
                                <span>{expanded ? copy.collapse : copy.expand}</span>
                                <FiChevronDown
                                    className={[
                                        'ai-summary__toggle-icon',
                                        expanded ? 'ai-summary__toggle-icon--expanded' : '',
                                    ].filter(Boolean).join(' ')}
                                    aria-hidden="true"
                                />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {hovered && <BorderBeam size={2} duration={3} borderRadius={16}/>}
        </div>
    );
}

export default AISummary;
