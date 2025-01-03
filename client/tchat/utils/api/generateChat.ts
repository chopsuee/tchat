import axios from "axios"

const ApiClient = axios.create({
    baseURL: "http://127.0.0.1:5000/"
})