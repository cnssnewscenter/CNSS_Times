from times import app
from flask import render_template, jsonify, request, g, session, abort, send_file, send_from_directory, url_for
from . import model
from functools import wraps
from datetime import datetime, timedelta
import os
from dateutil.parser import parse
import math
from collections import defaultdict

PAGEVIEW_CACHE = defaultdict(int)
LAST_UPDATE = datetime.now()


def get_page_hit(page):
    page_ = model.Hit.try_get(page=page)
    if page_:
        return page_.hit + PAGEVIEW_CACHE[page]
    else:
        hit = model.Hit.create(page=page, hit=PAGEVIEW_CACHE[page])
        PAGEVIEW_CACHE[page] = 0
        return 0 + hit.hit


@app.before_request
def init_the_user():
    session.modified = True
    session.permanent = True
    if "admin/api" in request.path or request.path.endswith("upload"):
        username = session.get("username")
        if username:
            user = model.AdminUser.try_get(username=username)
            if user:
                g.user = user
                g.logined = True
                return
    g.logined = False
    return


@app.route("/admin/api")
def api_plaeholder():
    abort(403)


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
            return jsonify(err=0, logined=True)
        else:
            return jsonify(err=1, logined=False)
    elif request.method == "POST":
        form = request.get_json()
        username = form.get("username")
        password = form.get("password")
        user = model.AdminUser.try_get(username=username)
        if user and user.check_pwd(password):
            session['username'] = username
            session.modified = True
            return jsonify(err=0, msg="登陆成功")

        return jsonify(err=1, msg="错误的用户名和密码组合")


@app.route("/admin/api/logout")
def logout():
    session.pop("username")
    return jsonify(err=0, msg="Token cleaned")


@app.route("/admin/api/post", methods=["GET", "PUT"], defaults={"pid": None})
@app.route("/admin/api/post/<pid>", methods=["GET", "POST", "DELETE"])
@need_login
def posts(pid):
    if pid is None:
        if request.method == "GET":
            page = int(request.args.get("page", 1))
            return jsonify(err=0, data=[i.to_dict() for i in model.Post.select().where(model.Post.deleted == False).paginate(page, 10)])
        elif request.method == "PUT":
            try:
                data = request.get_json()
                now = datetime.now()
                model.Post.create(
                    title=data['title'],
                    content=data["content"],
                    header=data['header'],
                    author=data['author'],
                    created=now,
                    creator=g.user.username,
                    other={},
                    published=parse(data['published']).replace(tzinfo=None),
                    operation_history=["created at {} by {}".format(now, g.user.username)],
                    status="toView"
                )
            except IndexError:
                abort(400)
            return jsonify(err=0, msg="新建成功")
    else:
        pid = int(pid)
        post = model.Post.try_get(id=pid)
        if post:
            if request.method == "GET":
                return jsonify(err=0, data=post.to_dict())
            elif request.method == "DELETE":
                post.deleted = True
                post.operation_history.append("deleted at {} by {}".format(datetime.now(), g.user.username))
                post.save()
                return jsonify(err=0, msg="已经删除到回收站")
            elif request.method == "POST":
                data = request.get_json()
                post.title = data['title']
                post.content = data['content']
                post.header = data['header']
                post.author = data["author"]
                post.other = data['other']
                post.published = parse(data['published']).replace(tzinfo=None)
                post.operation_history.append("modified at {} by {}".format(datetime.now(), g.user.username))
                status = data.get('status')
                post.deleted = False
                if status and post.status != status:
                    post.status = status
                    post.operation_history.append("set as {} at {} by {}".format(status, datetime.now(), g.user.username))
                post.save()
                return jsonify(err=0, msg="修改成功")
        abort(404)


def gen_file_name(filename):
    return "{0:%Y}/{0:%m}/{0:%s}-{0:%f}{1}".format(datetime.now(), os.path.splitext(filename)[-1])


@app.route("/admin/upload", methods=["POST"])
@need_login
def upload_file():
    try:
        with model.db.transaction():
            filename = request.form.get("filename", "") or list(request.files.values())[0].filename
            saved = gen_file_name(filename)
            final_path = os.path.join(app.config.get("UPLOAD", ""), saved)
            os.makedirs(os.path.split(final_path)[0], exist_ok=True)
            request.files["file"].save(final_path)
            model.Resource.create(
                filename=filename,
                created=datetime.now(),
                size=os.stat(os.path.join(app.config.get("UPLOAD"), saved)).st_size,
                path=saved
            )
            return jsonify(err=0, path=url_for('upload', path=saved))
    except Exception as e:
        app.logger.error("when uploading at {}".format(datetime.now()), exc_info=e)
        return jsonify(err=1, errmsg="There are some errors happened, plz contact the website manager")


@app.route('/admin/api/uploaded', methods=["GET"])
@need_login
def uploaded_file():
    if request.method == "GET":
        page = int(request.args.get("page", 1))
        keyword = request.args.get('key', None)
        if keyword:
            if " " in keyword:
                keyword = keyword.split()
                ret = []
                for i in keyword:
                    ret.extend([i.to_dict() for i in model.Resource.select().where(model.Resource.filename.contains(keyword)).paginate(page, 30)])
            else:
                ret = [i.to_dict() for i in model.Resource.select().where(model.Resource.filename.contains(keyword)).paginate(page, 30)]
            return jsonify(err=0, data=ret)
        else:
            return jsonify(err=0, data=[i.to_dict() for i in model.Resource.select().paginate(page, 30)])


@app.route("/admin/api/stats")
@need_login
def stats():
    code = request.args.get("id")
    if code:
        hit = model.Hit.try_get(page=code)
        return jsonify(err=0, hit=hit.hit)
    else:
        datas = {i.page: i.hit for i in model.Hit.select()}
        return jsonify(err=0, hits=datas)


@app.route('/admin/api/index_stats')
@need_login
def index_stats():
    posts = {
        "all": model.Post.select().where(model.Post.deleted == False).count(),
        "toView": model.Post.select().where((model.Post.deleted == False) & (model.Post.status == 'toView')).count(),
        "toPublish": model.Post.select().where((model.Post.deleted == False) & (model.Post.status == 'toPublish')).count(),
        "published": model.Post.select().where((model.Post.deleted == False) & (model.Post.status == "published")).count()
    }
    index = model.Hit.try_get(page="index")
    hit = index.hit if index else 0
    hits = {
        "index": hit,
        "max": [i.to_dict() for i in model.Hit.select().order_by(model.Hit.hit).limit(3)]
    }
    return jsonify(err=0, posts=posts, resource=model.Resource.select().count(), hits=hits)


@app.route('/upload/<path:path>')
@need_login
def upload_static_file(path):
    return send_from_directory(app.config['UPLOAD'], path)


@app.route('/hit/<page>')
def Hit(page):
    global PAGEVIEW_CACHE
    PAGEVIEW_CACHE[page] += 1
    # 每10分钟存储访问量的数据
    if datetime.now() - LAST_UPDATE > timedelta(minutes=10):
        a = model.Hit.update(hit=model.Hit.hit + PAGEVIEW_CACHE[page]).where(model.Hit.page == page).execute()
        if a == 0:
            model.Hit.insert(hit=PAGEVIEW_CACHE, page=page)
        PAGEVIEW_CACHE[page] = 0
    return " "


@app.route('/year/<year>')
@app.route("/", defaults={"year": None})
def show_index(year):
    global PAGEVIEW_CACHE
    page = int(request.args.get('p', 1))
    year = int(year) if year else datetime.now().year
    posts = model.Post.select().where((model.Post.deleted == False) & (model.Post.status == 'published'))
    hit = get_page_hit("year" + str(year))
    current_year = []
    years = []
    for i in posts:
        if i.published.year == year:
            current_year.append(i)
        else:
            if i.published.year not in years:
                years.append(i.published.year)
    years = sorted(years + [year])
    current_year = list(sorted(current_year, key=lambda x: x.published))
    length = len(current_year)
    pages = range(1, math.ceil(length / 8) + 1)

    if page > length / 8:
        page = math.ceil(length / 8)

    current_year = current_year[8 * (page - 1):8*page + 1]

    return render_template("index.html", base_url=app.prefix, posts=current_year, current_page=page, years=years, current=year, hit=hit, pages=pages, cur_page=page)


@app.route('/p/<pid>')
def post(pid):
    post = model.Post.try_get(id=int(pid))
    if not post or post.deleted:
        abort(404)
    else:
        hit = get_page_hit("post"+str(pid))
        next_p = list(model.Post.select().where((model.Post.published > post.published) & (model.Post.deleted == False)).order_by(model.Post.published).limit(1))
        prev_p = list(model.Post.select().where((model.Post.published < post.published) & (model.Post.deleted == False)).order_by(model.Post.published.desc()).limit(1))
        year = list(model.Post.select().where((model.Post.published >= post.published.replace(month=1, day=1) & (model.Post.published <= post.published.replace(month=12, day=31)))))
        year.remove(post)
        return render_template('post.html', base_url=app.prefix, post=post, category=year, prev_p=prev_p, next_p=next_p, hit=hit)


@app.route('/f/<int:fid>')
def get_file_by_id(fid):
    data = model.Resource.try_get(id=fid)
    if data:
        return send_from_directory(app.config['UPLOAD'], data.path)
    else:
        abort(404)


@app.route("/admin/", defaults={"path": None})
def admin_dashboard(path):
    # Fallback Router for other
    return render_template("admin.html", base_url=app.prefix)
