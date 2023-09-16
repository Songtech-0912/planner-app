from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import json
import argparse

BACKUP_JSON_NAME = "backup_latest.json"

app = Flask(__name__)
cors = CORS(app)

projects_database = []

@app.route("/")
def main():
    return "<p>You are probably looking for <a href='/database'>the database</a></p>"

@app.route("/database", methods=["GET", "POST"])
@cross_origin()
def database_route():
    global projects_database
    # save a copy of the database to json
    # every request, overwriting past
    # json backups
    with open(BACKUP_JSON_NAME, "w") as f:
        json.dump(projects_database, f, indent=4)
    # process requests
    if request.method == "POST":
        projects_database = request.get_json()
    return jsonify(projects_database)

if __name__ == "__main__":
    # load projects database from backup
    # json if requested
    parser = argparse.ArgumentParser(
        prog="Project Manager",
        description="A simple web application to manage projects")
    parser.add_argument('-b', '--backup_file')
    args = parser.parse_args()
    if args.backup_file:
        with open(args.backup_file, "r") as f:
            projects_database = json.load(f)
            print("Latest projects database:\n", projects_database)
    app.run()

