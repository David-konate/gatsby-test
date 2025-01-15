import React, { useState, useEffect, useCallback } from "react"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import axios from "axios"
import axiosInstance from "../services/axios"

const MarkdownEditor = () => {
  // Déclaration de l'état initial pour les métadonnées du fichier
  const [metadata, setMetadata] = useState({
    title: "",
    author: "",
    date: "",
    category: "",
    slug: "",
    image: "",
    cardImage: "",
    imageTitre: "",
    cardImageTitre: "",
    resume: "",
    sections: [], // Les sections sont désormais intégrées ici
  })

  // Déclaration de l'état initial pour le contenu
  const [content, setContent] = useState("")
  const [sections, setSections] = useState([]) // Sections du contenu
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0) // Index de la section actuelle
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(true) // Etat pour verrouiller le ratio d'aspect
  const [imagesData, setImagesData] = useState([]) // Données des images téléchargées

  // Fonction pour générer un slug à partir du titre
  const generateSlugFromTitle = useCallback(title => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim()
  }, [])

  // Utilisation de useEffect pour mettre à jour les sections dans les métadonnées lorsque les sections changent
  useEffect(() => {
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      sections: sections.map(section => ({
        text: section.text,
        image: section.image,
        imageHeight: section.imageHeight,
        imageWidth: section.imageWidth,
        imagePosition: section.imagePosition,
      })),
    }))
  }, [sections]) // Cette fonction s'exécute chaque fois que les sections changent

  // Fonction pour gérer le changement des métadonnées
  const handleMetadataChange = e => {
    const { name, value } = e.target
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      [name]: value,
    }))
  }

  // Fonction pour gérer les changements dans le contenu de l'éditeur
  const handleContentChange = value => {
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      resume: value, // Mettre à jour uniquement le champ `resume`
    }))
  }

  // Fonction pour gérer l'ajout/modification d'une section
  const handleSectionChange = value => {
    const updatedSections = [...sections]
    if (!updatedSections[currentSectionIndex]) {
      updatedSections[currentSectionIndex] = {
        text: "",
        image: "",
        imageHeight: null, // Pas de dimension par défaut
        imageWidth: null, // Pas de dimension par défaut
      }
    }
    updatedSections[currentSectionIndex].text = value
    setSections(updatedSections)
  }

  // Fonction pour télécharger l'image et ajuster les dimensions
  const handleImageUpload = event => {
    const file = event.target.files[0]

    if (file) {
      const reader = new FileReader()

      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const aspectRatio = img.width / img.height

          // Sauvegarder les informations de l'image dans imagesData
          const imageData = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            imageHeight: img.height,
            imageWidth: img.width,
            aspectRatio: aspectRatio,
            lastModified: new Date(file.lastModified), // Date de modification
          }

          // Mettre à jour imagesData en fonction de l'index actuel
          setImagesData(prevData => {
            const updatedData = [...prevData]
            updatedData[currentSectionIndex] = imageData // Sauvegarder l'image pour la section courante
            return updatedData
          })

          // Mise à jour ou création de la section actuelle avec l'image
          const newSections = [...sections]

          // Si la section courante n'existe pas, on la crée
          if (!newSections[currentSectionIndex]) {
            newSections[currentSectionIndex] = {
              text: "", // Texte vide au début
              image: reader.result, // Base64 de l'image
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              imageHeight: img.height,
              imageWidth: img.width,
              aspectRatio: aspectRatio,
              lastModified: new Date(file.lastModified),
              imagePosition: "top", // Position par défaut
            }
          } else {
            // Si la section existe, on met à jour l'image
            const section = newSections[currentSectionIndex]
            section.image = reader.result // Base64 de l'image
            section.fileName = file.name
            section.fileType = file.type
            section.fileSize = file.size
            section.imageHeight = img.height
            section.imageWidth = img.width
            section.aspectRatio = aspectRatio
            section.lastModified = new Date(file.lastModified)
          }

          // Mettre à jour les sections avec la nouvelle image
          setSections(newSections)

          // Préparer une nouvelle section vide pour une image future (si nécessaire)
          const newSection = {
            text: "", // Texte de la nouvelle section
            image: "", // Pas d'image au début
            imageHeight: null,
            imageWidth: null,
            imagePosition: "top", // Position par défaut
          }

          const updatedSectionsWithNew = [...newSections, newSection]
          setSections(updatedSectionsWithNew)
        }

        // Charger l'image pour obtenir ses dimensions
        img.src = reader.result
      }

      // Convertir l'image en Base64
      reader.readAsDataURL(file)
    }
  }

  const handleImageTitleUpload = event => {
    const file = event.target.files[0]

    if (file) {
      const reader = new FileReader()

      reader.onload = () => {
        const img = new Image()

        img.onload = () => {
          // Collect the image's metadata
          const imageData = {
            fileName: file.name, // File name
            fileType: file.type, // MIME type
            fileSize: file.size, // File size in bytes
            content: reader.result, // Base64 encoded image content
            dimensions: {
              // Image dimensions
              width: img.width,
              height: img.height,
              aspectRatio: img.width / img.height,
            },
            lastModified: new Date(file.lastModified), // Last modified date
          }

          // Update the state with the collected image data for backend
          setImagesData(prevData => {
            const newData = [...prevData]
            newData[0] = imageData // Insert the image data at the first position
            return newData
          })
        }

        // Trigger image loading to extract dimensions
        img.src = reader.result
      }

      reader.readAsDataURL(file) // Convert the file to Base64
    }
  }

  // Mise à jour des dimensions de l'image tout en tenant compte du verrouillage du ratio
  const handleSectionImageDimensionChange = (e, dimension) => {
    const updatedSections = [...sections]
    if (!updatedSections[currentSectionIndex]) {
      updatedSections[currentSectionIndex] = {
        text: "",
        image: "",
        imageHeight: null,
        imageWidth: null,
        aspectRatio: 1,
      }
    }

    const newValue = parseInt(e.target.value, 10)
    if (dimension === "imageHeight") {
      updatedSections[currentSectionIndex].imageHeight = newValue
      if (
        isAspectRatioLocked &&
        updatedSections[currentSectionIndex].aspectRatio
      ) {
        updatedSections[currentSectionIndex].imageWidth =
          newValue * updatedSections[currentSectionIndex].aspectRatio
      }
    } else if (dimension === "imageWidth") {
      updatedSections[currentSectionIndex].imageWidth = newValue
      if (
        isAspectRatioLocked &&
        updatedSections[currentSectionIndex].aspectRatio
      ) {
        updatedSections[currentSectionIndex].imageHeight =
          newValue / updatedSections[currentSectionIndex].aspectRatio
      }
    }

    setSections(updatedSections)
  }

  // Fonction pour générer le Markdown avec des sections et des images optionnelles
  const generateMarkdown = () => {
    const metadataString = ` 
  --- 
  title: ${metadata.title}
  author: ${metadata.author}
  date: ${metadata.date}
  category: "${metadata.category}"
  resume: "${metadata.resume}"
  slug: "${metadata.slug}"
  image: "${metadata.image}"   
  cardImage: "${metadata.cardImage}"
  sections:
  ${metadata.sections
    .map(
      (section, index) => `    - text: "${section.text || ""}"
    image: "${section.image || ""}"   
    imageHeight: ${section.imageHeight || "null"} 
    imageWidth: ${section.imageWidth || "null"}
    imagePosition: "${section.imagePosition || "top"}"`
    )
    .join("\n")}
  ---`

    const sectionsContent = metadata.sections
      .map((section, index) => {
        const imagePath = section.image
          ? `${metadata.title}/${section.image}`
          : ""
        return `### Section ${index + 1}
  
  ![Image de la section](${imagePath})
  
  ${section.text}`
      })
      .join("\n")

    return `${metadataString}\n\n${content}\n\n${sectionsContent}`
  }

  // Fonction pour sauvegarder l'article et afficher son contenu
  const saveArticle = async () => {
    try {
      // Générer le Markdown à partir des métadonnées et du contenu
      const markdownContent = generateMarkdown()

      // Créer un FormData pour envoyer le fichier markdown et ses métadonnées
      const formData = new FormData()
      formData.append(
        "file",
        new Blob([markdownContent], { type: "text/markdown" }),
        `${metadata.title}.md`
      )
      // Envoi du fichier markdown
      formData.append("title", metadata.title)
      formData.append("category", metadata.category)
      // Ajouter d'autres métadonnées ici si nécessaire
      console.log("edf")
      // Envoyer la requête POST avec Axios
      const response = await axiosInstance.post(
        "/routes/markdown/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      console.log("test")
      console.log(response)
      // Vérifier si la réponse est réussie
      if (response.status === 200) {
        // Traitement du succès, par exemple, redirection ou affichage d'un message
        alert("Article enregistré avec succès!")
        console.log(response.data) // Affichage des résultats
      } else {
        throw new Error("Erreur lors de l'enregistrement de l'article")
      }
    } catch (error) {
      // Traitement des erreurs avec les messages du backend
      alert(
        error.message || "Une erreur est survenue lors de l'enregistrement."
      )
    }
  }

  // Fonction pour ajouter une nouvelle section, avec un maximum de 4 sections
  const createNewSection = () => {
    if (metadata.sections.length < 4) {
      setMetadata({ ...metadata, sections: updatedSections })
      setCurrentSectionIndex(updatedSections.length - 1)
      const newSection = {
        text: "Nouveau texte de la section",
        image: "", // Réinitialiser l'image
        imageHeight: null,
        imageWidth: null,
        imagePosition: "top", // Position par défaut
      }
      const updatedSections = [...metadata.sections, newSection]
    } else {
      alert("Vous ne pouvez pas ajouter plus de 4 sections.")
    }
  }

  // Fonction pour revenir à la section précédente
  const goBackToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
    }
  }

  // Fonction pour activer ou désactiver le verrouillage du ratio d'aspect
  const handleAspectRatioLockChange = () => {
    setIsAspectRatioLocked(!isAspectRatioLocked)
  }

  const getImagePositionStyle = position => {
    switch (position) {
      case "top":
        return {
          display: "block",
          margin: "0 auto",
          clear: "both", // Empêche le chevauchement avec d'autres éléments
        }
      case "top-left":
        return {
          float: "left", // Image à gauche
          marginRight: "15px", // Marge à droite de l'image pour que le texte passe à droite
          marginBottom: "10px", // Un peu d'espace sous l'image
          maxWidth: "50%", // Limite la taille de l'image
          objectFit: "cover", // Garde l'image intacte
        }
      case "top-right":
        return {
          float: "right", // Image à droite
          marginLeft: "15px", // Marge à gauche de l'image pour que le texte passe à gauche
          marginBottom: "10px", // Un peu d'espace sous l'image
          maxWidth: "50%", // Limite la taille de l'image
          objectFit: "cover", // Garde l'image intacte
        }
      default:
        return {}
    }
  }
  // Fonction pour positionner l'image dans la section selon la position spécifiée
  const positionImage = position => {
    const updatedSections = [...sections]
    if (!updatedSections[currentSectionIndex]) {
      updatedSections[currentSectionIndex] = {
        text: "",
        image: "",
        imageHeight: 300,
        imageWidth: 300,
        imagePosition: "top", // Valeur par défaut
      }
    }

    // Vérification que la position soit valide et affectation de la position
    const validPositions = ["top", "top-left", "top-right"]
    if (validPositions.includes(position)) {
      updatedSections[currentSectionIndex].imagePosition = position
    }

    setSections(updatedSections)
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>Créer un article pour le blog</h1>

      {/* Formulaire de métadonnées */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          name="title"
          placeholder="Titre"
          value={metadata.title}
          onChange={handleMetadataChange}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <input
          type="text"
          name="author"
          placeholder="Auteur"
          value={metadata.author}
          onChange={handleMetadataChange}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <input
          type="date"
          name="date"
          value={metadata.date}
          onChange={handleMetadataChange}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <select
          name="category"
          value={metadata.category}
          onChange={handleMetadataChange}
          style={{
            display: "block",
            width: "100%",
            marginBottom: "10px",
            padding: "10px",
          }}
        >
          <option value="">Sélectionnez une catégorie</option>
          <option value="Events">Events</option>
          <option value="Application">Application</option>
          <option value="Divers">Divers</option>
          <option value="Playgrounds">Playgrounds</option>
          <option value="Streetball">Streetball</option>
        </select>
        <input
          type="text"
          name="slug"
          placeholder="Slug"
          value={metadata.slug}
          onChange={handleMetadataChange}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageTitleUpload}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
      </div>

      {/* Editeur Markdown pour le contenu principal */}
      <ReactQuill
        theme="snow"
        value={metadata.resume} // Utiliser metadata.resume ici pour lier la valeur
        onChange={handleContentChange} // Appeler la fonction handleContentChange pour mettre à jour `resume`
        style={{ height: "200px", marginBottom: "20px" }}
      />

      {/* Section actuelle */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Section {currentSectionIndex + 1}</h3>

        {/* Input field for the image upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />

        {/* Hauteur et largeur de l'image */}
        <input
          type="number"
          placeholder="Hauteur de l'image (px)"
          value={sections[currentSectionIndex]?.imageHeight || ""}
          onChange={e => handleSectionImageDimensionChange(e, "imageHeight")}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />

        <input
          type="number"
          placeholder="Largeur de l'image (px)"
          value={sections[currentSectionIndex]?.imageWidth || ""}
          onChange={e => handleSectionImageDimensionChange(e, "imageWidth")}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        {/* Bouton pour maintenir les proportions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <input
            type="checkbox"
            checked={isAspectRatioLocked}
            onChange={handleAspectRatioLockChange}
            style={{ marginRight: "10px" }}
          />
          <label>Maintenir les proportions (hauteur/largeur)</label>
        </div>
        <div style={{ margin: "10px", display: "flex", gap: "10px" }}>
          <label
            style={{
              padding: "10px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="imagePosition"
              value="top"
              onChange={() => positionImage("top")}
              style={{ marginRight: "5px" }}
            />
            Haut
          </label>

          <label
            style={{
              padding: "10px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="imagePosition"
              value="top-left"
              onChange={() => positionImage("top-left")}
              style={{ marginRight: "5px" }}
            />
            Haut/Gauche
          </label>

          <label
            style={{
              padding: "10px",
              backgroundColor: "#FFC107",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="imagePosition"
              value="top-right"
              onChange={() => positionImage("top-right")}
              style={{ marginRight: "5px" }}
            />
            Haut/Droit
          </label>
        </div>

        {/* ReactQuill Editor */}
        <ReactQuill
          value={sections[currentSectionIndex]?.text || ""}
          onChange={handleSectionChange}
          style={{ height: "200px", marginBottom: "20px" }}
        />
        <br />
        <br />
        {/* Buttons */}
        <div>
          <button
            onClick={createNewSection}
            style={{
              padding: "10px",
              backgroundColor: "#4CAF50",
              color: "white",
              marginTop: "10px",
            }}
            disabled={currentSectionIndex >= 3}
          >
            Créer une nouvelle section
          </button>
          <button
            onClick={goBackToPreviousSection}
            style={{
              padding: "10px",
              backgroundColor: "#f44336",
              color: "white",
              marginTop: "10px",
              marginLeft: "10px",
            }}
            disabled={currentSectionIndex <= 0}
          >
            Retour à la section précédente
          </button>
        </div>
      </div>

      {/* Aperçu Markdown */}
      <div
        style={{
          marginBottom: "20px",
          border: "1px solid #ddd",
          padding: "10px",
          textAlign: "center",
        }}
      >
        <div style={{ margin: "0 auto", maxWidth: "800px", padding: "20px" }}>
          <h1
            style={{
              color: "rgb(245, 109, 68)",
              fontWeight: "bold",
              fontSize: "45px",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            {metadata.title}
          </h1>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <p style={{ fontSize: "18px", margin: "5px" }}>{metadata.date}</p>
            <p style={{ margin: "0 5px", display: "inline" }}>par</p>
            <p style={{ fontSize: "18px", margin: "5px", display: "inline" }}>
              {metadata.author}
            </p>
            <p
              style={{
                fontSize: "18px",
                margin: "5px 0",
                textTransform: "uppercase",
              }}
            >
              {metadata.category}
            </p>
          </div>
          <p style={{ fontSize: "18px", margin: "5px 0", textAlign: "center" }}>
            {metadata.resume}
          </p>
          <div className="sections-container" style={{ marginTop: "20px" }}>
            {metadata.sections.map((section, index) => (
              <div
                key={section.id || index} // Utilisez un identifiant unique si possible
                className="section"
                style={{ marginBottom: "30px", textAlign: "left" }}
              >
                {section.image && (
                  <div style={{ marginBottom: "10px" }}>
                    <img
                      src={section.image}
                      alt={`Image de la section ${index + 1}`}
                      width={section.imageWidth || "100%"}
                      height={section.imageHeight || "auto"}
                      style={{
                        objectFit: "cover",
                        display: "inline-block", // Change à inline-block pour le flot
                        ...getImagePositionStyle(section.imagePosition), // Applique les styles de position
                      }}
                    />
                  </div>
                )}
                <p style={{ fontSize: "18px", marginTop: "10px" }}>
                  {section.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Markdown brut */}
      <textarea
        value={generateMarkdown()}
        readOnly
        style={{ width: "100%", height: "200px" }}
      />

      {/* Bouton de sauvegarde */}
      <button
        onClick={saveArticle}
        style={{
          padding: "10px",
          backgroundColor: "#2196F3",
          color: "white",
          marginTop: "10px",
        }}
      >
        Sauvegarder l'article
      </button>
    </div>
  )
}

export default MarkdownEditor
