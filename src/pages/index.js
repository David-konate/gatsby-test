import React, { useState, useEffect } from "react"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkDirective from "remark-directive"

const MarkdownEditor = () => {
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
  })

  const [content, setContent] = useState("")
  const [sections, setSections] = useState([])
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)

  // Fonction pour générer un slug à partir du titre
  const generateSlugFromTitle = title => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Supprimer les caractères non alphanumériques
      .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
      .trim()
  }

  // Mettre à jour le slug chaque fois que le titre change
  useEffect(() => {
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      slug: generateSlugFromTitle(metadata.title),
    }))
  }, [metadata.title]) // Exécuter uniquement lorsque le titre change

  const handleMetadataChange = e => {
    const { name, value } = e.target
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      [name]: value,
    }))
  }
  const handleContentChange = value => {
    setContent(value)
  }

  const handleSectionChange = value => {
    const updatedSections = [...sections]
    if (!updatedSections[currentSectionIndex]) {
      updatedSections[currentSectionIndex] = {
        text: "",
        image: "",
        imageHeight: 300,
        imageWidth: 300,
      }
    }
    updatedSections[currentSectionIndex].text = value
    setSections(updatedSections)
  }

  const createNewSection = () => {
    if (currentSectionIndex < 5) {
      setCurrentSectionIndex(currentSectionIndex + 1)
    } else {
      alert("Vous ne pouvez pas ajouter plus de 6 sections.")
    }
  }

  const goBackToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
    }
  }

  const handleImageUpload = event => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const newSections = [...sections]
          const aspectRatio = img.width / img.height // Calcul du ratio d'aspect

          if (!newSections[currentSectionIndex]) {
            newSections[currentSectionIndex] = {
              text: "",
              image: "",
              imageHeight: img.height,
              imageWidth: img.width,
              aspectRatio: aspectRatio, // Stocker le ratio
            }
          } else {
            newSections[currentSectionIndex].imageHeight = img.height
            newSections[currentSectionIndex].imageWidth = img.width
            newSections[currentSectionIndex].aspectRatio = aspectRatio // Mettre à jour le ratio
          }
          newSections[currentSectionIndex].image = reader.result
          setSections(newSections)
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSectionImageDimensionChange = (e, dimension) => {
    const updatedSections = [...sections]
    if (!updatedSections[currentSectionIndex]) {
      updatedSections[currentSectionIndex] = {
        text: "",
        image: "",
        imageHeight: 300,
        imageWidth: 300,
        aspectRatio: 1, // Valeur par défaut
      }
    }

    if (dimension === "imageHeight") {
      const newHeight = e.target.value
      updatedSections[currentSectionIndex].imageHeight = newHeight
      updatedSections[currentSectionIndex].imageWidth =
        newHeight * updatedSections[currentSectionIndex].aspectRatio
    } else if (dimension === "imageWidth") {
      const newWidth = e.target.value
      updatedSections[currentSectionIndex].imageWidth = newWidth
      updatedSections[currentSectionIndex].imageHeight =
        newWidth / updatedSections[currentSectionIndex].aspectRatio
    }

    setSections(updatedSections)
  }

  const handleSectionImageChange = e => {
    const updatedSections = [...sections]
    if (!updatedSections[currentSectionIndex]) {
      updatedSections[currentSectionIndex] = {
        text: "",
        image: "",
        imageHeight: 300,
        imageWidth: 300,
        imagePosition: "none", // Ajout du champ pour la position de l'image
      }
    }
    updatedSections[currentSectionIndex].image = e.target.value
    setSections(updatedSections)
  }

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
    if (["top", "top-left", "top-right"].includes(position)) {
      updatedSections[currentSectionIndex].imagePosition = position
    }
    setSections(updatedSections)
  }

  // Génération Markdown avec dimensions d'image
  const generateMarkdown = () => {
    const metadataString = ` 
  --- 
  title: ${metadata.title}
  author: ${metadata.author}
  date: ${metadata.date}
  category: "${metadata.category}"
  slug: "${metadata.slug}"
  image: "${metadata.image}"
  cardImage: "${metadata.cardImage}"
  ---
  
  ${content}
  
  ${sections
    .map((section, index) => {
      const resizedImage = section.image
        ? `${section.image}?resize=500x500` // Applique une taille à l'image
        : "" // Si aucune image, garde vide

      return `### Section ${index + 1}
  
  ![Image de la section](${resizedImage})
  
  ${section.text}`
    })
    .join("\n")}`
    return metadataString
  }

  // Ajouter un rendu personnalisé pour ReactMarkdown.
  // Ajouter un rendu personnalisé pour ReactMarkdown.
  const MarkdownPreview = ({ markdown, sections }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkDirective]}
        rehypePlugins={[rehypeRaw]}
        components={{
          img: ({ node, ...props }) => {
            const { src, alt } = props
            const section = sections.find(
              section => section.image && section.image.includes(src)
            )

            let imageStyle = {
              maxWidth: "100%",
              width: `${section?.imageWidth || 300}px`,
              height: `${section?.imageHeight || 300}px`,
            }

            // Appliquer la position de l'image (gauche, droite, haut-gauche, bas-droit, etc.)
            switch (section?.imagePosition) {
              case "top":
                imageStyle = {
                  ...imageStyle,
                  display: "block",
                  margin: "0 auto 10px", // Centré en haut
                }
                break
              case "top-left":
                imageStyle = {
                  ...imageStyle,
                  float: "left",
                  marginRight: "10px", // Texte à droite de l'image
                  marginBottom: "10px",
                }
                break
              case "top-right":
                imageStyle = {
                  ...imageStyle,
                  float: "right",
                  marginLeft: "10px", // Texte à gauche de l'image
                  marginBottom: "10px",
                }
                break
              default:
                imageStyle = { ...imageStyle, clear: "both" }
                break
            }

            return (
              <div style={{ marginBottom: "10px", clear: "both" }}>
                {section ? (
                  <img
                    src={section.image}
                    alt={alt || "Image"}
                    style={imageStyle}
                  />
                ) : (
                  <p>Image non trouvée</p>
                )}
              </div>
            )
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    )
  }

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
          type="url"
          placeholder="URL de l'image de la titre"
          value={metadata.imageTitre || ""}
          onChange={handleSectionImageChange}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
      </div>

      {/* Editeur Markdown pour le contenu principal */}
      <ReactQuill
        theme="snow"
        value={content}
        onChange={handleContentChange}
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

        {/* Buttons */}
        <button
          onClick={createNewSection}
          style={{
            padding: "10px",
            backgroundColor: "#4CAF50",
            color: "white",
            marginTop: "10px",
          }}
          disabled={currentSectionIndex >= 5}
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

      {/* Aperçu Markdown */}
      <div
        style={{
          marginBottom: "20px",
          border: "1px solid #ddd",
          padding: "10px",
        }}
      >
        <h2>Aperçu</h2>
        <MarkdownPreview markdown={generateMarkdown()} sections={sections} />
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
