"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import PageLoader from "@/components/PageLoader";

import api from "@/lib/api";

const HomeView = dynamic(() => import("@/components/HomeView"), {
  loading: () => <PageLoader />,
  ssr: false,
});


export default function DashboardPage() {
  const { user, sessionChecking, handleUnauthorized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN" || user?.role?.toUpperCase()?.includes("ADMIN")) {
      router.replace("/superadmin/dashboard");
    } else if (user?.role === "SUPPORT") {
      router.replace("/orders");
    }
  }, [user, router]);

  if (sessionChecking || !user || user.role !== "USER") {
    return <PageLoader />;
  }



  // Health check state
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const healthFetching = useRef(false);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docCacheHeader, setDocCacheHeader] = useState("");
  const [fetchingDocsTime, setFetchingDocsTime] = useState(0);
  const docsFetching = useRef(false);

  // S3 Upload state
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("102400");
  const [mimeType, setMimeType] = useState("application/pdf");
  const [uploadResult, setUploadResult] = useState(null);
  const [submittingDoc, setSubmittingDoc] = useState(false);

  const fetchHealth = async () => {
    if (healthFetching.current) return;
    healthFetching.current = true;
    setLoadingHealth(true);
    try {
      const data = await api.get("/health");
      setHealth(data);
    } catch {
      setHealth({ success: false, services: { server: "offline", database: "unknown", cache: "unknown" } });
    } finally {
      setLoadingHealth(false);
      healthFetching.current = false;
    }
  };


  const fetchDocuments = async () => {
    if (docsFetching.current) return;
    docsFetching.current = true;
    setLoadingDocs(true);
    const startTime = performance.now();
    try {
      const { data, response } = await api.get("/documents", { raw: true });
      setFetchingDocsTime(Math.round(performance.now() - startTime));
      setDocCacheHeader(response.headers.get("X-Cache") || "MISS/NONE");
      if (data.success) setDocuments(data.data);
    } catch (err) {
      if (err.status === 401) {
        handleUnauthorized();
        return;
      }
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoadingDocs(false);
      docsFetching.current = false;
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!title || !fileName) return;
    setSubmittingDoc(true);
    setUploadResult(null);
    try {
      const { data } = await api.request(
        "/documents/presign-upload",
        {
          method: "POST",
          body: JSON.stringify({ title, fileName, fileSize: parseInt(fileSize), mimeType }),
        },
        { raw: true }
      );
      if (data.success) {
        setUploadResult(data.data);
        setTitle("");
        setFileName("");
        fetchDocuments();
      }
    } catch (err) {
      if (err.status === 401) {
        handleUnauthorized();
        return;
      }
      console.error(err);
    } finally {
      setSubmittingDoc(false);
    }
  };


  return (
    <HomeView
      user={user}
      health={health}
      fetchHealth={fetchHealth}
      loadingHealth={loadingHealth}
      documents={documents}
      fetchDocuments={fetchDocuments}
      loadingDocs={loadingDocs}
      docCacheHeader={docCacheHeader}
      fetchingDocsTime={fetchingDocsTime}
      title={title}
      setTitle={setTitle}
      fileName={fileName}
      setFileName={setFileName}
      mimeType={mimeType}
      setMimeType={setMimeType}
      fileSize={fileSize}
      setFileSize={setFileSize}
      uploadResult={uploadResult}
      submittingDoc={submittingDoc}
      handleUploadSubmit={handleUploadSubmit}
    />
  );
}
