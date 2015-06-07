from flask.ext.script import Manager
from times import app
from times import model
import getpass

manager = Manager(app)


@manager.command
def admin_create():
    username = input("Username: ")
    password = getpass.getpass()
    with model.db.transaction():

        new_user = model.AdminUser(username=username)
        new_user.set_pwd(password)
        new_user.save()

    print("Finish Created the user {}".format(username))


if __name__ == "__main__":
    manager.run()
