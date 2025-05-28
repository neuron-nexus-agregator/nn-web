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
		engine.LoadHTMLFiles(
			"frontend/templates/index.html",
			"frontend/html/all.html",
			"frontend/html/single.html",
			"frontend/templates/footer.html",
			"frontend/templates/header.html",
		)
	} else {
		engine.LoadHTMLGlob("frontend/templates/*.html")
	}
	engine.Static("/static/images", "frontend/assets/images")
	engine.Static("/static/fonts", "frontend/assets/fonts")
	engine.Static("/static/css", "frontend/css")
	engine.Static("/static/js", "frontend/js")
	return &Server{
		Router: engine,
	}
}

func (s *Server) Get(path string, handler gin.HandlerFunc) {
	s.Router.GET(path, handler)
}

func (s *Server) Run(addr string) {
	s.Router.Run(addr)
}

func main() {
	server := NewServer()
	server.Get("/", func(c *gin.Context) {
		c.HTML(200, "index.html", gin.H{
			"title":  "Gin",
			"style":  "/static/css/index.css",
			"script": "/static/js/index.js",
		})
	})
	server.Get("/all", func(c *gin.Context) {
		c.HTML(200, "all.html", gin.H{
			"title":  "Gin",
			"style":  "/static/css/all.css",
			"script": "/static/js/all.js",
		})
	})
	server.Get("/reg", func(c *gin.Context) {
		c.HTML(200, "index.html", gin.H{
			"title":  "Gin",
			"style":  "/static/css/index.css",
			"script": "/static/js/index.js",
		})
	})
	server.Get("/news/:id", func(c *gin.Context) {
		c.HTML(200, "single.html", gin.H{
			"title":  "Gin",
			"style":  "/static/css/single.css",
			"script": "/static/js/single.js",
		})
	})
	server.Run(":8080")
}
