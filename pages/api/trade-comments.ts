import type { NextApiRequest, NextApiResponse } from "next"
import { addComment } from "@/lib/actions/trade-comments"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const result = await addComment(req.body)
    if (result.success) {
      res.status(200).json(result)
    } else {
      res.status(400).json(result)
    }
  } else {
    res.status(405).json({ error: "Method not allowed" })
  }
} 