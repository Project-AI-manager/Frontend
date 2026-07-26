import { NextResponse } from "next/server";

// На этапе wireframe все маршруты открыты для быстрой проверки структуры.
export function proxy() { return NextResponse.next(); }

export const config = { matcher: [] };
