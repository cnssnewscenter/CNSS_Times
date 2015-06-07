from times import app
from flask import render_template, jsonify, request, g, session, abort, send_file
import jwt
from . import model
from functools import wraps
from datetime import datetime, timedelta
import json
import os


@app.before_request
def init_the_user():
    if request.path.startswith("/admin/api"):
        token = session.get("Authentication")
        if token:
            try:
                info = jwt.decode("token", app.secret_key)
                user = model.User.try_get(id=info.get("uid"))
                if user:
                    g.user = user
                    g.logined = True
                    return
                g.logined = False
                return
            except jwt.InvalidTokenError:
                g.logined = False
                return
    g.logined = False
    return


def need_login(func):

    @wraps(func)
    def wrappered(*args, **kwargs):
        if not g.logined:
            abort(403)
            return
        return func(*args, **kwargs)
    return wrappered


@app.route("/admin/api/login", methods=["GET", "POST"])
def login_status():
    if request.method == "GET":
        if g.logined:
            return jsonify(err=0, logined=True, user=g.user.to_dict())
        else:
            return jsonify(err=1, logined=False)
    elif request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        user = model.AdminUser.try_get(username=username)
        if user and user.check_pwd(password):
            session['Authentication'] = jwt.encode({"uid": user.uid, "exp": datetime.utcnow() + timedelta(days=1), "nbf": datetime.utcnow() - timedelta(mins=5)}, app.secret_key)
            return jsonify(err=0, msg="登陆成功")

        return jsonify(err=1, msg="错误的用户名和密码组合")


@app.route("/admin/api/logout")
def logout():
    session['Authentication'] = None
    return jsonify(err=0, msg="Token cleaned")


@app.route("/admin/api/post", methods=["GET", "PUT"], defaults={"pid": None})
@app.route("/admin/api/post/<pid>", methods=["GET", "POST", "DELETE"])
@need_login
def posts(pid):
    if pid is None:
        if request.method == "GET":
            page = int(request.args.get("page", 1))
            return jsonify(err=0, posts=[i for i in model.Post.select().paginate(page, 10)])
        elif request.method == "PUT":
            now = datetime.now()
            model.Post.create(
                title=request.form['title'],
                content=request.form["content"],
                header=json.loads(request.form['header']),
                author=json.loads(request.form['author']),
                type=request.form['type'],
                created=now,
                other={},
                operation_history=["created at {}".format(now)],
                status=0
            )
            return jsonify(err=0, msg="新建成功")
    else:
        pid = int(pid)
        post = model.Post.try_get(id=pid)
        if post:
            if request.method == "GET":
                return jsonify(err=0, post=post.to_dict())
            elif request.method == "DELETE":
                post.status = -1
                post.operation_history.append("deleted at {} by {}".format(datetime.now(), g.user.username))
                post.save()
                return jsonify(err=0, msg="已经删除到回收站")
            elif request.method == "POST":
                post.title = request.form['title']
                post.content = request.form['content']
                post.header = json.loads(request.form['header'])
                post.author = json.loads(request.form["type"])
                post.other = json.loads(request.form['other'])
                post.operation_history.append("modified at {} by {}".format(datetime.now(), g.user.username))
                post.status = int(request.form.get('status'))
                post.published = datetime.strptime(request.form['published'], "%Y-%m-%dT%H:%M:%S.%f%Z")
                post.save()
                return jsonify(err=0, msg="修改成功")
        abort(404)


def gen_file_name(filename):
    return "{0:%Y}/{0:%m}/{0:%s}-{0:%f}{1}".format(datetime.now(), os.path.splitext(filename)[-1])


@app.route("/admin/upload", methods=["GET", "POST"])
def upload_file():
    if request.method == "GET":
        page = request.args.get("page", 1)
        return jsonify(err=0, data=model.Resource.select().paginate(page, 30))
    elif request.method == "POST":
        try:
            with model.db.transaction():
                filename = request.form.get("filename") or request.files[0].filename
                saved = gen_file_name(filename)
                request.files[0].save(os.path.join(app.config.get("UPLOAD"), saved))
                model.Resource.create(
                    filename=filename,
                    created=datetime.now(),
                    size=os.stat(os.path.join(app.config.get("UPLOAD"), saved)).st_size,
                    path=saved
                )
                return jsonify(err=0, path=os.path.join("upload", saved))
        except Exception as e:
            app.logger.error("when uploading at {}".format(datetime.now()), exc_info=e)
            return jsonify(err=1, errmsg="There are some errors happened, plz contact the website manager")


@app.route("/admin/", defaults={"path": None})
@app.route("/admin/<path>")
def admin_dashboard(path):
    # Fallback Router for other
    return send_file("static/admin.html")


@app.route("/")
def show_index():
    return render_template("index.html")