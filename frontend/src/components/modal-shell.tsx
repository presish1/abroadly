"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function ModalShell({
  open,
  onClose,
  titleId,
  children,
  panelClassName = "",
  layerClassName = "",
  closeLabel = "Close dialog",
  showClose = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  mobileSheet = false,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  panelClassName?: string;
  layerClassName?: string;
  closeLabel?: string;
  showClose?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  mobileSheet?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const panelRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef({ pointerId: -1, startY: 0, lastY: 0, lastAt: 0, velocity: 0 });
  onCloseRef.current = onClose;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [mounted]);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setClosing(false);
      setDragOffset(0);
    }
  }, [open]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (mobileSheet && isMobile && !reduceMotion) {
      closingRef.current = true;
      setClosing(true);
      setDragOffset(0);
      closeTimerRef.current = setTimeout(() => onCloseRef.current(), 180);
      return;
    }
    onCloseRef.current();
  }, [isMobile, mobileSheet]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!mobileSheet || !isMobile || closing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      lastAt: event.timeStamp,
      velocity: 0,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const elapsed = Math.max(event.timeStamp - drag.lastAt, 1);
    drag.velocity = (event.clientY - drag.lastY) / elapsed;
    drag.lastY = event.clientY;
    drag.lastAt = event.timeStamp;
    setDragOffset(Math.max(0, event.clientY - drag.startY));
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const distance = Math.max(0, event.clientY - drag.startY);
    dragRef.current.pointerId = -1;
    if (distance >= 96 || (distance >= 24 && drag.velocity >= 0.45)) {
      requestClose();
    } else {
      setDragOffset(0);
    }
  }

  useEffect(() => {
    if (!open || !mounted) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusPanel = window.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first || panelRef.current)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusPanel);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [closeOnEscape, mounted, open, requestClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`modal-shell-layer ${mobileSheet ? "modal-shell-mobile-layer" : ""} ${closing ? "is-closing" : ""} ${layerClassName}`}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) requestClose();
      }}
    >
      <section
        ref={panelRef}
        className={`modal-shell-panel ${mobileSheet ? "modal-shell-mobile-sheet" : ""} ${closing ? "is-closing" : ""} ${dragOffset > 0 ? "is-dragging" : ""} ${panelClassName}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        style={mobileSheet && isMobile && dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
      >
        {mobileSheet && (
          <div
            className="modal-sheet-drag-handle"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerDrag}
            onPointerCancel={finishPointerDrag}
            aria-hidden="true"
          >
            <span />
          </div>
        )}
        {showClose && (
          <button type="button" onClick={requestClose} aria-label={closeLabel} className="ab-focus modal-shell-close">
            <svg viewBox="0 0 18 18" aria-hidden fill="none">
              <path d="m5 5 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
        {children}
      </section>
    </div>,
    document.body,
  );
}
