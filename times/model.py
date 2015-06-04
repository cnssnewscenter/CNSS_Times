from peewee import Model, MySQLDatabase, PostgresqlDatabase, TextField, CharField, DateTimeField, IntegerField
from .config import DEBUG
import json
from .utils import *
from datetime import datetime

if DEBUG:
    from peewee import SqliteDatabase
    db = SqliteDatabase("test_db.sqlite3")
else:
    db = PostgresqlDatabase()


class JsonField(TextField):
    """
    A Simple helper to write the im-structed data like author
    """
    def db_value(self, value):
        value = json.dumps(value)
        return super(JsonField, self).db_value(value)

    def python_value(self, value):
        value = super(JsonField, self).python_value(value)
        return json.loads(value)


class BaseModel(Model):
    class Meta:
        database = db

    @classmethod
    def try_get(cls, *args, **kwargs):
        try:
            return cls.get(*args, **kwargs)
        except cls.DoesNotExist:
            return kwargs.get("default")

class AdminUser(BaseModel):

    username = CharField()
    password = CharField()
    salt = CharField()

    def set_pwd(self, password):
        self.salt = random_text(40)
        self.password = sha1sum(password + self.salt)

    def check_pwd(self, password):
        return self.password == sha1sum(password + self.salt)

class Post(BaseModel):

    title = CharField()
    content = TextField()
    type = CharField()
    header = JsonField()
    author = JsonField()
    created = DateTimeField()
    other = JsonField()
    operation_history = JsonField()
    status = CharField()


class Resource(BaseModel):

    filename = CharField()
    created = DateTimeField()
    size = IntegerField()
    path = CharField()


def init_the_database(database):
    database.create_tables([Resource, Post, AdminUser], safe=True)