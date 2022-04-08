import { getSession } from "next-auth/react";
import formidable from "formidable";
import fs from "fs";
import FormData from "form-data"
const API_ENDPOINT = "https://managed.mypinata.cloud/api/v1";
const IDENTIFIER = "3d5468b3-f0ae-4a16-b726-6f09d009723a";

export const config = {
  api: {
    bodyParser: false,
  }
};

const getIndexFile = async () => {
  try {
    const query = `metadata[keyvalues]={"uuid":{"value":"${IDENTIFIER}","op":"eq"}}`;
      const imagesRes = await fetch(`${API_ENDPOINT}/content?${query}`, {
        headers: {
          "x-api-key": process.env.SUBMARINE_KEY,
        },
      });      
      const imageIndex = await imagesRes.json();  
      let indexFile = [];
      if (imageIndex.items.length > 0) {
        const { id, cid } = imageIndex.items[0];
        const body = {
          timeoutSeconds: 3600,
          contentIds: [id],
        }; 
        const tokenRes = await fetch(`${API_ENDPOINT}/auth/content/jwt`, {
          method: "POST",
          headers: {
            "x-api-key": process.env.SUBMARINE_KEY,
            "content-type": "application/json"
          },
          body: JSON.stringify(body),
        });
        const token = await tokenRes.json();
        const dataRes = await fetch(
          `https://${process.env.GATEWAY_URL}/ipfs/${cid}?accessToken=${token}`
        );
        
        indexFile = await dataRes.json();
      }

      return indexFile;
  } catch (error) {
    throw error;
  }
}

const saveFile = async (file) => {
  try {
    const stream = fs.createReadStream(file.filepath);
    let newFormData = new FormData();
    newFormData.append('files', stream);

    const res = await fetch(`${API_ENDPOINT}/content`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.SUBMARINE_KEY,
      },
      body: newFormData,
    });

    const resData = await res.json(); 
    const { id, cid, createdAt} = resData.items[0];

    const indexFile = await getIndexFile();

    indexFile.push({
      id,
      cid,
      createdAt
    });
    
    const metadata = {
      uuid: IDENTIFIER,
    };

    const content = {
      "cidVersion": 1,
      "wrapWithDirectory": false,
      "pinToIPFS": false,
      "name": `${IDENTIFIER}.json`,
      "metadata": JSON.stringify(metadata),
      "content": JSON.stringify(indexFile)
    }
    
    const metadataRes = await fetch(`${API_ENDPOINT}/content/json`, {
      method: "POST",
      headers: {
        "content-type": "application/json", 
        "x-api-key": process.env.SUBMARINE_KEY,
      },
      body: JSON.stringify(content),
    });

    fs.unlinkSync(file.filepath);

    return
  } catch (error) {
    throw error;
  }
}

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (req.method === "POST") {
    try {
      if (!session) {
        return res.status(401).send("Not signed in");
      }
      const form = new formidable.IncomingForm();
      form.parse(req, async function (err, fields, files) {
        if(err) {
          console.log({err})
          throw err;
        }
        await saveFile(files.file);
        return res.status(201).send("Success");
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  } else {
    try {
      if (!session) {
        return res.status(401).send("Not signed in");
      }
      const indexFile = await getIndexFile();
      res.status(200).json({ imageIndex: indexFile });
    } catch (error) {
      console.log(error);
      res.status(500).send("Server error");
    }
  }
}
