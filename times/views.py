from times import app
from flask import redirect, url_for, render_template, send_from_directory, jsonify


@app.route("/admin/api/login", methods=["GET", "POST"])
def login_status():
    return jsonify()

@app.route("/admin/<path>")
def admin_dashboard():
    return send_from_directory("static/admin.html")

@app.route("/")
def show_index():
    return render_template("index.html")