from flask import Flask, jsonify
import os
from datetime import timedelta
from json import JSONEncoder
from datetime import datetime


app = Flask(__name__)
app.secret_key = os.urandom(20)
app.permanent_session_lifetime = timedelta(days=1)
app.config.from_pyfile("config.py")

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

from . import model

model.init_the_database(model.db)

from . import views