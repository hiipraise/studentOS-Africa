// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/shared/EmptyState";

describe("EmptyState", () => {
  it("shows its message and optional recovery link", () => {
    render(createElement(EmptyState, { title: "No matches", message: "Try another search.", href: "/opportunities", hrefLabel: "Browse opportunities" }));
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse opportunities" })).toHaveAttribute("href", "/opportunities");
  });
});
