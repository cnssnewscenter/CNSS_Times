from peewee import Model, MySQLDatabase, PostgresqlDatabase, TextField
from config import debug
from datetime import datetime

if debug:
    from peewee import SqliteDatabase
    db = SqliteDatabase("test_db.sqlite3")
else:
    db = PostgresqlDatabase()


class JsonField(TextField):

    def db_value(self, value):
        return json.dumps(value)

    def python_value(self, value):
        value = 
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
