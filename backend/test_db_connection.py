import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database config from environment variables
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": os.getenv("DB_PORT", "3306"),  # Default to 3306 if not specified
    "ssl_ca": "ca-certificate.pem",  # Path to SSL certificate
    "ssl_verify_cert": True,
    "use_pure": True,
}

# Print connection details (hiding password)
print("Connection details:")
for key, value in DB_CONFIG.items():
    if key != "password":
        print(f"  {key}: {value}")
    else:
        print(f"  {key}: {'*' * 8}")

try:
    # Attempt to connect to the database
    print("\nAttempting to connect to MySQL database...")
    conn = mysql.connector.connect(**DB_CONFIG)

    if conn.is_connected():
        db_info = conn.get_server_info()
        print(f"✅ SUCCESS: Connected to MySQL Server version {db_info}")

        cursor = conn.cursor(dictionary=True)

        # Check which database we're connected to
        cursor.execute("SELECT DATABASE();")
        db_name = cursor.fetchone()
        print(f"Using database: {db_name['DATABASE()']} ✅")

        # Check if aqi_records table exists
        print("\nChecking table structure...")
        cursor.execute(
            """
            SELECT TABLE_NAME, TABLE_ROWS
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'aqi_records'
        """,
            (DB_CONFIG["database"],),
        )

        table_info = cursor.fetchone()
        if table_info:
            print(
                f"Table 'aqi_records' exists with approximately {table_info['TABLE_ROWS']} rows ✅"
            )

            # Get the table structure
            cursor.execute("DESCRIBE aqi_records;")
            columns = cursor.fetchall()

            print("\nTable structure:")
            for column in columns:
                print(f"  {column['Field']} ({column['Type']})")

            # Get some sample data
            cursor.execute("SELECT * FROM aqi_records LIMIT 5;")
            sample_data = cursor.fetchall()

            if sample_data:
                print("\nSample data (first 5 rows):")
                for row in sample_data:
                    print(f"  {row}")
            else:
                print("\nNo data found in the table.")
        else:
            print("❌ Table 'aqi_records' does not exist in the database.")

        # Close cursor and connection
        cursor.close()
        conn.close()
        print("\nMySQL connection closed.")

except Error as e:
    print(f"❌ ERROR: {e}")

    # Provide more detailed error diagnosis
    if "Unknown MySQL server host" in str(e):
        print(
            "\nHostname could not be resolved. Check if the DB_HOST value is correct."
        )
    elif "Access denied" in str(e):
        print(
            "\nUsername or password is incorrect. Check your DB_USER and DB_PASSWORD values."
        )
    elif "Can't connect to MySQL server" in str(e):
        print("\nCould not connect to the server. Possible causes:")
        print("1. The server is not running")
        print("2. Your IP is not allowed to connect (check firewall/network settings)")
        print("3. The port number is incorrect (default is 3306)")
        print("4. SSL certificate issues")
    elif "SSL connection error" in str(e):
        print("\nSSL connection error. Check if:")
        print("1. The ca-certificate.pem file exists in the current directory")
        print("2. The SSL certificate is valid for this server")
        print("3. Try setting 'ssl_verify_cert' to False for testing")
    elif "Unknown database" in str(e):
        print("\nThe specified database does not exist. Check the DB_NAME value.")
