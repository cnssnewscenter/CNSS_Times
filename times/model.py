from peewee import Model, PostgresqlDatabase, TextField, CharField, DateTimeField, IntegerField, BooleanField
from .config import DEBUG
import json
from .utils import *

if DEBUG:
    from peewee import SqliteDatabase
    db = SqliteDatabase("test_db.sqlite3")
else:
    db = PostgresqlDatabase()


class JsonField(TextField):

    """
    A Simple helper to write the unstructed data like author
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

    def to_dict(self):
        return self._data


class AdminUser(BaseModel):

    username = CharField(unique=True)
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
    published = DateTimeField(null=True)
    other = JsonField()
    operation_history = JsonField()
    status = IntegerField()
    deleted = BooleanField(default=False)


class Resource(BaseModel):

    filename = CharField()
    created = DateTimeField()
    size = IntegerField()
    path = CharField()


class Hit(BaseModel):

    page = CharField(unique=True)
    hit = IntegerField()


def init_the_database(database):
    database.create_tables([Resource, Post, AdminUser, Hit], safe=True)
