import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
  try {
    const existingInspector = await db.user.findFirst({
      where: { role: "INSPECTOR" },
    })

    if (existingInspector) {
      return NextResponse.json({ message: "Inspector already exists", user: existingInspector })
    }

    const inspector = await db.user.create({
      data: {
        name: "Roberto Vega",
        email: "inspector@colegio.cl",
        role: "INSPECTOR",
      },
    })

    return NextResponse.json({ message: "Inspector created", user: inspector })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create inspector" }, { status: 500 })
  }
}
