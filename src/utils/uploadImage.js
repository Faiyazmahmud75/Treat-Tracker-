// Cloudinary upload function
export const uploadImage = async (file) => {
  // We use Cloudinary as an alternative to Firebase Storage to avoid billing setup.
  // TODO: For production, you should create a free Cloudinary account, 
  // get your cloud name, and create an "unsigned upload preset" in the settings.
  
  // Using the provided cloud name. Make sure you have created an unsigned upload preset!
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) {
      throw new Error("Upload failed");
    }
    
    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error("Error uploading image to Cloudinary", err);
    return null;
  }
};
