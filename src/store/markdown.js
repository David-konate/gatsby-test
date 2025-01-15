import axios from "axios"

// Fonction principale pour sauvegarder l'article
const saveArticleBack = async () => {
  try {
    // 1. Génération du contenu Markdown
    const markdownContent = generateMarkdown()
    console.log("Contenu Markdown généré :", markdownContent)

    // 2. Envoi du Markdown à Cloudinary
    const cloudinaryResponse = await uploadToCloudinary(markdownContent)
    const markdownUrl = cloudinaryResponse.secure_url // URL publique du fichier Markdown
    console.log("Markdown uploadé à Cloudinary :", markdownUrl)

    // 3. Envoi des métadonnées et de l'URL au backend
    const backendResponse = await saveMetadataToBackend(markdownUrl)
    console.log("Réponse du backend :", backendResponse)

    // Affichage de l'alerte lorsque l'article est sauvegardé avec succès
    alert("Article sauvegardé avec succès !")
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l'article :", error)
    alert("Une erreur est survenue lors de la sauvegarde de l'article.")
  }
}

// Fonction pour uploader le Markdown à Cloudinary
const uploadToCloudinary = async markdownContent => {
  const formData = new FormData()
  formData.append("file", new Blob([markdownContent], { type: "text/plain" }))
  formData.append("upload_preset", "votre_preset") // Remplacez par votre preset Cloudinary

  try {
    const response = await axios.post(
      "https://api.cloudinary.com/v1_1/votre_nom_cloudinary/raw/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return response.data
  } catch (error) {
    throw new Error("Échec de l'envoi à Cloudinary")
  }
}

// Fonction pour envoyer les métadonnées au backend
const saveMetadataToBackend = async markdownUrl => {
  const payload = {
    ...metadata, // Vos métadonnées
    markdownUrl, // URL du fichier Markdown sur Cloudinary
  }

  try {
    const response = await axios.post(
      "http://votre-backend-url/api/articles",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    return response.data
  } catch (error) {
    throw new Error("Échec de l'envoi au backend")
  }
}
