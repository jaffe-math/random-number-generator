Quickstart at https://cloud.google.com/functions/docs/quickstart
Set account and project: `gcloud init`
Choose choice [3] then select account and project

To deploy `gcloud beta functions deploy rng --trigger-http --runtime nodejs10`
URL endpoint: `https://us-central1-gradebook-71f6b.cloudfunctions.net/rng`

Functions emulator: `https://cloud.google.com/functions/docs/emulator`
To test functions start debug
        functions call rng --data='<JSON object>'
To stop functions debug stop

Test call: 
functions call emailPr --data='{"to":["rogerjaffe@gmail.com"],"subject":"Test subject","teacherEmail":"rogerjaffe@mrjaffesclass.com","teacherName":"Teacher name","prText":"Progress report for Roger","prHtml":"<html><head><title>Progress report for RJ</title></head><body>Roger is getting a A</body></html>"}'
