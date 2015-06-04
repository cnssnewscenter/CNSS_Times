from times import app
from flask import redirect, url_for, render_template

@app.route("/admin/")
def admin_dashboard():
    return redirect(url_for("admin_login"))

@app.route("/admin/login")
def admin_login():
    return render_template("admin_login.html")