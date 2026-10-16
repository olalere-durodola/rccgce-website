"""Create a new disposable SQLite fixture from committed migrations, never a configured DB."""
from pathlib import Path
import shutil
import sqlite3
import tempfile

root = Path(__file__).resolve().parents[1]
directory = Path(tempfile.mkdtemp(prefix='rccgce-build-'))
database = directory / 'fixture.sqlite'
try:
    with sqlite3.connect(database) as connection:
        for migration in sorted((root / 'prisma/migrations').glob('*/migration.sql')):
            connection.executescript(migration.read_text())
    print('DATABASE_URL=file:' + str(database))
except Exception:
    shutil.rmtree(directory)
    raise
