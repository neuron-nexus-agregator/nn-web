package main

import (
	"os"

	"github.com/gin-gonic/gin"
)

type Server struct {
	Router *gin.Engine
}

func NewServer() *Server {
	if os.Getenv("MODE") != "debug" {
		gin.SetMode(gin.ReleaseMode)
	}
	engine := gin.Default()
	if gin.Mode() == gin.ReleaseMode {
		engine.LoadHTMLFiles("./frontend/templates/*.html")
		engine.LoadHTMLFiles("./frontend/html/*.html")
	} else {
		engine.LoadHTMLGlob("./frontend/templates/*.html")
		engine.LoadHTMLGlob("./frontend/html/*.html")
	}
	engine.StaticFS("/frontend", gin.Dir("./frontend", true))
	return &Server{
		Router: engine,
	}
}
