"use client";

import { useEffect } from "react";

export function ScrollRevealObserver() {
  useEffect(() => {
    // Enable scroll reveal styling on client
    document.documentElement.classList.add("js-ready");

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      // Fallback: reveal all immediately if IntersectionObserver is unsupported
      document.querySelectorAll(".scroll-reveal").forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // Trigger 120px before entering viewport bottom, ensuring smooth arrival with zero blank space
        rootMargin: "120px 0px -20px 0px",
        threshold: 0.05,
      }
    );

    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach((el) => observer.observe(el));

    // Safety timeout: ensure everything is visible even under heavy thread load
    const timer = setTimeout(() => {
      document.querySelectorAll(".scroll-reveal:not(.is-revealed)").forEach((el) => {
        el.classList.add("is-revealed");
      });
    }, 1500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
