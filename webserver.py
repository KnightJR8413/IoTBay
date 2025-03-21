from flask import Flask, send_from_directory

app = Flask(__name__)

# Serve the HTML file
@app.route("/")
def serve_html():
    return send_from_directory("WebPages/HTML", "index.html")

# Serve CSS files
@app.route("/HTML/CSS/<path:filename>")
def serve_css(filename):
    return send_from_directory("WebPages/HTML/CSS", filename)

# Serve Image files
@app.route("/HTML/images/<path:filename>")
def serve_images(filename):
    return send_from_directory("WebPages/HTML/images", filename)

# Serve JS files
@app.route("/HTML/JAVA/<path:filename>")
def serve_js(filename):
    return send_from_directory("WebPages/HTML/JAVA", filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
