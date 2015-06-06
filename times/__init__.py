from flask import Flask

app = Flask(__name__)

from . import model

model.init_the_database(model.db)

from . import views