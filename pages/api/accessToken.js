import { getSession } from "next-auth/react";
const API_ENDPOINT = "https://managed.mypinata.cloud/api/v1";

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).send("Not signed in");
    }
    const { id, cid } = req.query;
    if (!id || !cid) {
      return res.status(400).send("No ID or no CID provided");
    }

    const body = {
      timeoutSeconds: 3600,
      contentIds: [id],
    };

    const tokenRes = await fetch(`${API_ENDPOINT}/auth/content/jwt`, {
      method: "POST",
      headers: {
        "content-type": "application/json", 
        "x-api-key": process.env.SUBMARINE_KEY,
      },
      body: JSON.stringify(body),
    });    
    const token = await tokenRes.json();
    res.send(`https://${process.env.GATEWAY_URL}/ipfs/${cid}?accessToken=${token}`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
}
