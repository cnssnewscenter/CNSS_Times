from peewee import Model, PostgresqlDatabase, TextField, CharField,  IntegerField, BooleanField, BigIntegerField
from peewee import DateTimeField as raw_datetimefield
from .config import DEBUG
import json
from .utils import *

if DEBUG:
    from peewee import SqliteDatabase
    db = SqliteDatabase("test_db.sqlite3")
    import logging
    logger = logging.getLogger('peewee')
    logger.setLevel(logging.DEBUG)
    logger.addHandler(logging.StreamHandler())
else:
    db = PostgresqlDatabase('times', user="times")


class DateTimeField(raw_datetimefield):

    '''
    remove the tzinfo when saving
    '''

    def db_value(self, value):
        return super(DateTimeField, self).db_value(value.replace(tzinfo=None))


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
    creator = CharField()
    content = TextField()
    header = JsonField()
    author = JsonField()
    created = DateTimeField()
    published = DateTimeField(null=True)
    other = JsonField()
    operation_history = JsonField()
    status = CharField()
    deleted = BooleanField(default=False)

    def index_data(self):
        return {
            "title": self.title,
            "author": self.author,
            "published": self.published,
            "content": self.content
        }


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
