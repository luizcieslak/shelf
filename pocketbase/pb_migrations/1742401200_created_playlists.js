/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: "playlists",
    type: "base",
    listRule: "@request.auth.id != \"\" && user = @request.auth.id",
    viewRule: "@request.auth.id != \"\" && user = @request.auth.id",
    createRule: "@request.auth.id != \"\" && @request.data.user = @request.auth.id",
    updateRule: "@request.auth.id != \"\" && user = @request.auth.id",
    deleteRule: "@request.auth.id != \"\" && user = @request.auth.id",
    fields: [
      {
        name: "user",
        type: "relation",
        required: true,
        presentable: false,
        options: {
          collectionId: "_pb_users_auth_",
          cascadeDelete: true,
          minSelect: null,
          maxSelect: 1,
          displayFields: null
        }
      },
      {
        name: "platform",
        type: "select",
        required: true,
        presentable: false,
        options: {
          maxSelect: 1,
          values: ["spotify", "google", "apple"]
        }
      },
      {
        name: "platform_id",
        type: "text",
        required: true,
        presentable: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "name",
        type: "text",
        required: true,
        presentable: true,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "description",
        type: "text",
        required: false,
        presentable: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "image_url",
        type: "url",
        required: false,
        presentable: false,
        options: {
          exceptDomains: null,
          onlyDomains: null
        }
      },
      {
        name: "track_count",
        type: "number",
        required: true,
        presentable: false,
        options: {
          min: 0,
          max: null,
          noDecimal: true
        }
      },
      {
        name: "external_url",
        type: "url",
        required: true,
        presentable: false,
        options: {
          exceptDomains: null,
          onlyDomains: null
        }
      },
      {
        name: "synced_with",
        type: "json",
        required: false,
        presentable: false,
        options: {
          maxSize: 2000000
        }
      },
      {
        name: "last_synced",
        type: "date",
        required: false,
        presentable: false,
        options: {
          min: "",
          max: ""
        }
      }
    ],
    indexes: [
      "CREATE INDEX idx_playlists_user_platform ON playlists(user, platform)",
      "CREATE INDEX idx_playlists_lookup ON playlists(user, platform, platform_id)"
    ]
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("playlists")
  return app.delete(collection)
})
