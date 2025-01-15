import React, { useState, useEffect, useCallback } from "react"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"

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
          const newSections = [...sections]
          const aspectRatio = img.width / img.height

          // Mise à jour ou création de la section actuelle
          if (!newSections[currentSectionIndex]) {
            newSections[currentSectionIndex] = {
              text: "",
              image: reader.result, // Base64 de l'image
              fileName: file.name, // Nom du fichier
              fileType: file.type, // Type MIME
              fileSize: file.size, // Taille du fichier
              imageHeight: img.height,
              imageWidth: img.width,
              aspectRatio: aspectRatio, // Ratio d'aspect
              lastModified: new Date(file.lastModified), // Date de modification
            }
          } else {
            const section = newSections[currentSectionIndex]
            section.image = reader.result // Base64
            section.fileName = file.name
            section.fileType = file.type
            section.fileSize = file.size
            section.imageHeight = img.height
            section.imageWidth = img.width
            section.aspectRatio = aspectRatio
            section.lastModified = new Date(file.lastModified)
          }

          // Met à jour les sections avec la nouvelle image
          setSections(newSections)

          // Préparation des données de l'image pour le backend
          const imageData = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            lastModified: new Date(file.lastModified),
          }

          // Mise à jour des données dans imagesData en fonction de l'index actuel
          setImagesData(prevData => {
            const updatedData = [...prevData]
            updatedData[currentSectionIndex] = imageData
            return updatedData
          })
        }

        img.src = reader.result
      }

      reader.readAsDataURL(file) // Convertir l'image en Base64
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

  // Fonction pour ajouter une nouvelle section, avec un maximum de 4 sections
  const createNewSection = () => {
    if (currentSectionIndex < 3) {
      setCurrentSectionIndex(currentSectionIndex + 1)
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
    if (
      [
        "top",
        "top-left",
        "top-right",
        "center",
        "bottom-left",
        "bottom-right",
      ].includes(position)
    ) {
      updatedSections[currentSectionIndex].imagePosition = position
    }
    setSections(updatedSections)
  }
  // Fonction pour sauvegarder l'article et afficher son contenu
  const saveArticle = () => {
    alert("Article sauvegardé avec succès !")
    console.log(generateMarkdown())
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
        <div
          style={{
            margin: "10px",
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={() => positionImage("top")}
            style={{
              padding: "10px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Haut
          </button>
          <button
            onClick={() => positionImage("top-left")}
            style={{
              padding: "10px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Haut/Gauche
          </button>
          <button
            onClick={() => positionImage("top-right")}
            style={{
              padding: "10px",
              backgroundColor: "#FFC107",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Haut/Droit
          </button>
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
          textAlign: "center", // Centre le contenu
        }}
      >
        {/* Centrer les metadata (titre, auteur, date, catégorie) */}
        <div style={{ marginBottom: "20px" }}>
          <h1
            style={{
              color: "rgb(245, 109, 68)",
              fontWeight: "bold",
              fontSize: "45px",
            }}
          >
            {metadata.title}
          </h1>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ fontSize: "18px", margin: "5px" }}>{metadata.date}</p>
              <p style={{ margin: "0 5px" }}>par</p>
              <p style={{ fontSize: "18px", margin: "5px" }}>
                {metadata.author}
              </p>
            </div>

            <p style={{ fontSize: "18px", margin: "5px 0" }}>
              {metadata.category}
            </p>
            <p style={{ fontSize: "18px", margin: "5px 0" }}>
              {metadata.resume}
            </p>

            <div className="sections-container" style={{ borderTop: 8 }}>
              {metadata.sections.map((section, index) => (
                <div key={index} className="section">
                  <p>{section.text}</p>
                  {section.image && (
                    <img
                      src={section.image}
                      alt={`Image de la section ${index + 1}`}
                      width={section.imageWidth}
                      height={section.imageHeight}
                      style={{
                        // Ajouter la logique pour la position de l'image
                        objectFit: "cover", // Pour s'assurer que l'image occupe bien l'espace
                        position: "relative",
                        left: section.imagePosition.includes("left")
                          ? 0
                          : "auto",
                        right: section.imagePosition.includes("right")
                          ? 0
                          : "auto",
                        top: section.imagePosition === "top" ? 0 : "auto",
                        bottom: section.imagePosition === "bottom" ? 0 : "auto",
                        margin:
                          section.imagePosition === "center"
                            ? "0 auto"
                            : "auto", // Centrer l'image
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* <MarkdownPreview markdown={generateMarkdown()} sections={sections} /> */}
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
