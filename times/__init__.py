from flask import Flask
import os
from datetime import timedelta
from json import JSONEncoder
from datetime import datetime
from .config import DEBUG


config = {
    # "static_folder": "static",
    # "static_url_path": "/static"
}


class ReservePoxied():

    """
    take from: http://flask.pocoo.org/snippets/35/
    """

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        script_name = environ.get('HTTP_X_SCRIPT_NAME', '')
        if script_name:
            environ['SCRIPT_NAME'] = script_name
            path_info = environ['PATH_INFO']
            if path_info.startswith(script_name):
                environ['PATH_INFO'] = path_info[len(script_name):]
        scheme = environ.get('HTTP_X_SCHEME', '')
        if scheme:
            environ['wsgi.url_scheme'] = scheme
        return self.app(environ, start_response)


app = Flask(__name__, **config)
app.secret_key = os.urandom(20)
app.permanent_session_lifetime = timedelta(days=1)
app.config.from_pyfile("config.py")
app.prefix = "/times/"
app.wsgi_app = ReservePoxied(app.wsgi_app)
app.use_x_sendfile = not app.config['DEBUG']

class CustomJsonEncoder(JSONEncoder):

    def default(self, obj):
        try:
            if isinstance(obj, datetime):
                return obj.isoformat() + "+0800"
            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)
        return JSONEncoder.default(self, obj)

app.json_encoder = CustomJsonEncoder

__folder__ = os.path.dirname(__file__)
__static__ = os.path.normpath(os.path.join(__folder__, "static"))
__upload__ = os.path.normpath(os.path.join(__folder__, "../upload"))

@app.after_request
def change_url(response):
    path = response.headers.get('X-Sendfile')
    if path:
        if "times/static" in path:
            response.headers["X-Accel-Redirect"] = os.path.join("/times/static/", os.path.relpath(path, __static__))
        elif "upload/" in path:
            response.headers["X-Accel-Redirect"] = os.path.join("/uploaded_file/", os.path.relpath(path, __upload__))
        # response.headers["X-Sendfile"] = None
    return response

from . import model

model.init_the_database(model.db)

from . import views