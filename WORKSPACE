workspace(name = "nielsshootsfilm_planfirst")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

# Bazel Skylib provides common Starlark utilities used by many Bazel rules.
http_archive(
    name = "bazel_skylib",
    urls = ["https://github.com/bazelbuild/bazel-skylib/releases/download/1.4.2/bazel-skylib-1.4.2.tar.gz"],
    sha256 = "eecaceeec8ad3f3dde27933c0f495d5038522b6feeb8fbf2084cdc9fdb5c3da3",
)

# Go toolchain and rules for building backend services.
http_archive(
    name = "rules_go",
    urls = ["https://github.com/bazelbuild/rules_go/releases/download/v0.43.1/rules_go-v0.43.1.zip"],
    sha256 = "a5aee5115e1efc9c35e5ad9e8432c10cbbcb1e50637e2b2fc90d92c1e099f399",
)

load("@rules_go//go:deps.bzl", "go_register_toolchains", "go_rules_dependencies")

go_rules_dependencies()
go_register_toolchains(version = "1.22.3")

# NodeJS / TypeScript toolchain for frontend builds.
http_archive(
    name = "rules_nodejs",
    urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/v6.1.1/rules_nodejs-6.1.1.tar.gz"],
    sha256 = "b6f6020d6f3d79042f2ffdc97327d48f980b5c0acf2f618731cb9bee4c92b42e",
)

load("@rules_nodejs//nodejs:repositories.bzl", "nodejs_register_toolchains")

nodejs_register_toolchains(
    name = "nodejs_toolchains",
    node_version = "20.12.2",
)

# TypeScript rules layered on top of rules_nodejs.
http_archive(
    name = "aspect_rules_ts",
    urls = ["https://github.com/aspect-build/rules_ts/releases/download/v1.3.0/rules_ts-v1.3.0.tar.gz"],
    sha256 = "d3e9f43dff9f3a56707ac227e40cb6a6cf008f6b5c1ada2b19c6407059d6dc68",
)

load("@aspect_rules_ts//ts:deps.bzl", "rules_ts_dependencies")

rules_ts_dependencies()

# Yarn/NPM dependencies for the frontend are defined in package.json.
load("@aspect_rules_ts//ts:repositories.bzl", "rules_ts_register_toolchains")

rules_ts_register_toolchains()

# Configure npm to install dependencies from the workspace.
load("@rules_nodejs//nodejs:npm_repositories.bzl", "npm_repositories")

npm_repositories(
    package_json = "//frontend:package.json",
    package_lock = "//frontend:package-lock.json",
)
