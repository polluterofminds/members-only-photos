import React, { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const Gallery = () => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [index, setIndex] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadPage, setUploadPage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const fileInput = useRef(null);
  useEffect(() => {
    if (
      session &&
      session.user &&
      session.user.name &&
      address !== session.user.name
    ) {
      setAddress(session.user.name);
      loadFiles();
    } else {
      setLoading(false);
    }
  }, [session]);

  const loadFiles = async () => {
    const res = await fetch(`/api/media`);
    const data = await res.json();
    setIndex(data.imageIndex);
    getUrls(data.imageIndex);
    setLoading(false);
  };

  const getUrls = async (indexArray) => {
    let urls = [];
    for (const indexFile of indexArray) {
      try {
        const res = await fetch(
          `/api/accessToken?id=${indexFile.id}&cid=${indexFile.cid}`
        );
        const url = await res.text();
        urls.push(url);
        setImageUrls(urls);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const onChange = (e) => {
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      Object.assign(files[i], {
        preview: URL.createObjectURL(files[i]),
        formattedSize: files[i].size,
      });
    }

    setSelectedFiles(files);
  };

  const upload = async () => {
    try {
      if (!selectedFiles || selectedFiles.length === 0) {
        throw new Error("No file selected");
      }
      setUploading(true);
      const body = new FormData();
      body.append("file", selectedFiles[0]);
      await fetch("/api/media", {
        method: "POST",
        body,
      });

      setUploading(false);
      setUploadPage(false);
      loadFiles();
    } catch (error) {
      console.log(error);
      setUploading(false);
      alert(error);
    }
  };

  if (loading) {
    <div>
      <h1>Loading...</h1>
    </div>;
  } else if (uploadPage) {
    return (
      <div>
        {uploading ? (
          <div>
            <h3>Uploading...</h3>
          </div>
        ) : (
          <div>
            <span>Select a file</span>
            <input
              id="file-upload-main"
              name="file-upload-main"
              type="file"
              accept="image/*"
              className="sr-only"
              ref={fileInput}
              onChange={onChange}
            />
            <button onClick={upload}>Upload Now</button>

            <button onClick={() => setUploadPage(false)}>Cancel Upload</button>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div>
        {!session ? (
          <div>
            <h1>You need to sign in</h1>
            <Link href="/">Sign in</Link>
          </div>
        ) : (
          <div>
            <div>
              <button onClick={signOut}>Sign Out</button>
            </div>
            <h1>The Gallery</h1>
            <button onClick={() => setUploadPage(true)}>
              Upload New Photo
            </button>
            <div className="grid-container">
              {imageUrls.map((url) => {
                return (
                  <div key={url} className="grid-item">
                    <img className="img" src={url} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default Gallery;
