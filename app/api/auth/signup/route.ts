import { NextResponse } from "next/server"
import { createUser, generateToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name } = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser(email, password, name)
    
    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
    })

    // Return token in response
    return NextResponse.json({
      user,
      token,
      message: "User created successfully",
    })
  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
