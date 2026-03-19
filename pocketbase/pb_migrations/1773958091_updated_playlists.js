/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_976091127")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_playlists_user_platform ON playlists(user, platform)",
      "CREATE INDEX idx_playlists_lookup ON playlists(user, platform, platform_id)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_976091127")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
