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


@manager.command
def reset_password():
    username = input("Username: ")
    new_passwd = getpass.getpass("New Password: ")
    with model.db.transaction():
        user = model.AdminUser.try_get(username=username)
        if user:
            user.set_pwd(new_passwd)
            user.save()
        else:
            print("Can't find the user")
            return

    print("Finish reset password for {}".format(username))

@manager.command
def clean():
    print('This will drop the whole datebase')
    print('you should run "dropdb times" with correct privileges')

if __name__ == "__main__":
    manager.run()
