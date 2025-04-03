# to use press run then got to your ip:5000
# to get your ip you can see when you start the script where is says running on http://your IP
# this also hosts on local host as well as online

from flask import Flask, send_from_directory, render_template
from flask_cors import CORS

app = Flask(__name__, template_folder='WebPages/HTML')
CORS(app)

# Dynamic route to serve any page (e.g. /login, /about, /contact)
@app.route("/<page_name>")
def serve_page(page_name):
    try:
        return render_template(f"{page_name}.html")
    except:
        return "Page not found", 404

# Serve CSS files
@app.route("/CSS/<path:filename>")
def serve_css(filename):
    return send_from_directory("WebPages/HTML/CSS", filename)

# Serve Image files
@app.route("/images/<path:filename>")
def serve_images(filename):
    return send_from_directory("WebPages/HTML/images", filename)

# Serve JS files
@app.route("/JAVA/<path:filename>")
def serve_js(filename):
    return send_from_directory("WebPages/HTML/scripts", filename)

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
