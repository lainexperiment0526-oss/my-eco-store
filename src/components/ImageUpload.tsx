import React, { useRef } from "react";

interface ImageUploadProps {
  label: string;
  onUpload: (url: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ label, onUpload }) => {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For demo: use a local URL. Replace with upload logic (e.g. Supabase, S3)
    const url = URL.createObjectURL(file);
    onUpload(url);
  };

  return (
    <div className="mb-2">
      <label className="block mb-1 font-medium">{label}</label>
      <input
        type="file"
        accept="image/*"
        ref={fileInput}
        onChange={handleFileChange}
        className="block w-full border p-2 rounded"
      />
    </div>
  );
};

export default ImageUpload;
