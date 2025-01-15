import axios from "axios"

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // Remplacez par le port de votre backend Node.js
  timeout: 5000,
  withCredentials: true,
})

export default axiosInstance
