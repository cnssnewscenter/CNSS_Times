from flask import Flask
from os import urandom
from datetime import timedelta

app = Flask(__name__)
app.secret_key = urandom(20)
app.permanent_session_lifetime = timedelta(days=1)

from . import model

model.init_the_database(model.db)

from . import views