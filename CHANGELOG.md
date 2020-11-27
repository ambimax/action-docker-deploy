# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog].

<!-- begin:changelog -->

## 2.1.0 - 2020-11-27

### Added

- You can now specify a namespace to use, other than `default`. ([#11])
- Changelog \o/ ([#11])

### Fixed

- The helm chart that is used to deploy the image now uses the "new" networking.k8s.io/v1beta1 ingress on clusters running Kubernetes ^v1.14. This fixes a problem where new versions rejected the ingress completely. ([#11])

<!-- Version Links -->

[#11]: https://github.com/ambimax/action-docker-deploy/pull/11

---

<!-- Links -->

[keep a changelog]: https://keepachangelog.com/
