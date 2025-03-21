# to use press run then got to localhost:5000 or 127.0.0.1:5000
# this exclusively hosts on local host and cannot be accessed from another computer through your IP


from flask import Flask, send_from_directory, render_template

app = Flask(__name__, template_folder='WebPages/HTML')

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
    return send_from_directory("WebPages/HTML/JAVA", filename)

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
