import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OnboardingPage from "@/app/onboarding/page";

describe("Onboarding wireframe",()=>{it("shows three setup stages",()=>{render(<OnboardingPage/>);expect(screen.getByRole("heading",{name:"1. Профиль"})).toBeInTheDocument();expect(screen.getByRole("heading",{name:"2. Telegram"})).toBeInTheDocument();expect(screen.getByRole("heading",{name:"3. База знаний"})).toBeInTheDocument();});});
