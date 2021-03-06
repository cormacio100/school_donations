from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
import os

app = Flask(__name__)

'''
REMOTE HEROKU SETTINGS
'''
#MONGO_URI = os.getenv('MONGODB_URI','mongodb://localhost:27017')
#DBS_NAME = os.getenv('MONGO_DB_NAME','donorUSA')

'''
LOCAL SETTINGS
'''
MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'donorsUSA'

COLLECTION_NAME = 'projects'


@app.route("/")
def index():
    """
    A Flask view to serve the main dashboard page.
    """

    #return app.root_path
    return render_template("index.html")


'''
    Function represents the API that the fornt end talks to
'''
@app.route("/donorsUS/projects")
def donor_projects():
    """
    A Flask view to serve the project data from
    MongoDB in JSON format.
    """

    # A constant that defines the record fields that we wish to retrieve.
    FIELDS = {
        '_id': False, 'funding_status': True, 'school_state': True,
        'resource_type': True, 'poverty_level': True,
        'date_posted': True, 'total_donations': True
    }

    # Open a connection to MongoDB using a with statement such that the
    # connection will be closed as soon as we exit the with statement

    '''
    REMOTE HEROKU DB SETTINGS
    '''
    #with MongoClient(MONGO_URI) as conn:
        # Define which collection we wish to access
    #    collection = conn[DBS_NAME][COLLECTION_NAME]
        # Retrieve a result set only with the fields defined in FIELDS
        # and limit the the results to 55000
    #    projects = collection.find(projection=FIELDS, limit=20000)
        # Convert projects to a list in a JSON object and return the JSON data
    #    return json.dumps(list(projects))

    '''
    LOCAL DB SETTTINGS
    '''
    with MongoClient(MONGODB_HOST, MONGODB_PORT) as conn:
        # Define which collection we wish to access
        collection = conn[DBS_NAME][COLLECTION_NAME]
        # Retrieve a result set only with the fields defined in FIELDS
        # and limit the the results to 55000
        projects = collection.find(projection=FIELDS, limit=55000)
        # Convert projects to a list in a JSON object and return the JSON data
        return json.dumps(list(projects))


if __name__ == "__main__":
    app.run(debug=True)