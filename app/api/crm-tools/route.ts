import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dashboard = searchParams.get('dashboard')

  if (dashboard === 'true') {
    // Return dashboard data
    return NextResponse.json({
      tools: [
        { id: 1, name: "Lead Generator", status: "active", leads: 24 },
        { id: 2, name: "Email Campaign", status: "active", sent: 156 },
        { id: 3, name: "Follow-up Bot", status: "paused", followUps: 8 },
      ]
    })
  }

  // Return all CRM tools
  return NextResponse.json({
    tools: [
      { id: 1, name: "Lead Generator", description: "Automatically find and qualify leads", status: "active" },
      { id: 2, name: "Email Campaign", description: "Send personalized email sequences", status: "active" },
      { id: 3, name: "Follow-up Bot", description: "Automated follow-up messages", status: "paused" },
      { id: 4, name: "Social Media Monitor", description: "Track mentions and engagement", status: "inactive" },
    ]
  })
}
