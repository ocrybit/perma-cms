import { useEffect, useState } from "react"
import { Image, Button, Flex, Box, useToast } from "@chakra-ui/react"
import { Link } from "react-router-dom"
import { map } from "ramda"
import { getAddr, getProf } from "./lib/utils"

import Header from "./components/Header"
const roboto = {
  fontFamily: `"Roboto Mono", monospace`,
  fontOpticalSizing: "auto",
  fontWeight: 600,
  fontStyle: "normal",
}
function App() {
  const [address, setAddress] = useState(null)
  const [profile, setProfile] = useState(null)
  const [init, setInit] = useState(false)
  const t = useToast()
  const boxW = ["100%", null, "50%", 1 / 3]
  useEffect(() => getAddr({ setAddress, setInit, t }), [])
  useEffect(
    () => getProf({ address, setProfile, setInit, setAddress, t }),
    [address],
  )

  return (
    <>
      <Header
        {...{ t, address, setAddress, profile, setProfile, init, setInit }}
      />
      <Flex justify="center" pt="60px" h="100%">
        <Flex w="100%" maxW="854px" px={3} pt={4} h="100%" direction="column">
          <Flex mt={16} sx={{ ...roboto }}>
            <Flex direction="column">
              <Box fontSize={["40px", "50px", "60px"]}>Atomic Notes</Box>
              <Box fontSize={["14px", "17px", "20px"]}>
                A New Decentralized Social Primitive.
              </Box>
              <Box>
                <Link to="/n/new/edit">
                  <Button
                    variant="outline"
                    colorScheme="gray"
                    mt={10}
                    sx={{
                      border: "1px solid #222326",
                      ":hover": { bg: "#f6f6f7" },
                    }}
                  >
                    Create Notes
                  </Button>
                </Link>
                <Link
                  to="https://github.com/ocrybit/atomic-notes/tree/master/sdk"
                  target="_blank"
                >
                  <Button
                    ml={6}
                    variant="outline"
                    colorScheme="gray"
                    mt={10}
                    sx={{
                      border: "1px solid #222326",
                      ":hover": { bg: "#f6f6f7" },
                    }}
                  >
                    Use SDK
                  </Button>
                </Link>
              </Box>
            </Flex>
          </Flex>
          <Flex mt={10} wrap="wrap">
            <Box w={boxW}>
              <Box
                mr={[0, null, 4]}
                mb={4}
                sx={{ borderRadius: "10px" }}
                bg="#f6f6f7"
                p={4}
              >
                <Box mb={2} sx={{ ...roboto }}>
                  Atomic Assets
                </Box>
                <Box fontWeight="normal" fontSize="15px">
                  Data, licenses and smart contracts are all stored together on
                  Arweave as tradable atomic assets on UCMs like{" "}
                  <Link target="_blank" to="http://bazar.arweave.dev">
                    <Box as="u" mr={2}>
                      BazAR
                    </Box>
                  </Link>
                  .
                </Box>
              </Box>
            </Box>
            <Box w={boxW}>
              <Box
                mr={[0, null, 4]}
                mb={4}
                sx={{ borderRadius: "10px" }}
                bg="#f6f6f7"
                p={4}
              >
                <Box mb={2} sx={{ ...roboto }}>
                  Universal Data License
                </Box>
                <Box fontWeight="normal" fontSize="15px">
                  Profit sharing and royalty distribution are to be automated by
                  Universal Content Marketplaces with onchain UDLs.
                </Box>
              </Box>
            </Box>
            <Box w={boxW}>
              <Box
                mr={[0, null, 4]}
                mb={4}
                sx={{ borderRadius: "10px" }}
                bg="#f6f6f7"
                p={4}
              >
                <Box mb={2} sx={{ ...roboto }}>
                  Editable Notes on AO
                </Box>
                <Box fontWeight="normal" fontSize="15px">
                  AO enables delta updates on permanent data, co-authoring, and
                  semantic version control with AO processes / smart contracts.
                </Box>
              </Box>
            </Box>
            <Box w={boxW}>
              <Box
                mr={[0, null, 4]}
                mb={4}
                sx={{ borderRadius: "10px" }}
                bg="#f6f6f7"
                p={4}
              >
                <Box mb={2} sx={{ ...roboto }}>
                  Built for Developers
                </Box>
                <Box fontWeight="normal" fontSize="15px">
                  Atomic notes introduce a new social primitive built with a
                  developer-first approach, providing an SDK and APIs.
                </Box>
              </Box>
            </Box>
            <Box w={boxW}>
              <Box
                mr={[0, null, 4]}
                mb={4}
                sx={{ borderRadius: "10px" }}
                bg="#f6f6f7"
                p={4}
              >
                <Box mb={2} sx={{ ...roboto }}>
                  ArNS Integration
                </Box>
                <Box fontWeight="normal" fontSize="15px">
                  <Link target="_blank" to="http://arns.app">
                    <Box as="u" mr={2}>
                      ArNS
                    </Box>
                  </Link>
                  domains provide censorship-resistant access to your content
                  through thousands of decentralized gateways.
                </Box>
              </Box>
            </Box>
            <Box w={boxW}>
              <Box
                mr={[0, null, 4]}
                mb={4}
                sx={{ borderRadius: "10px" }}
                bg="#f6f6f7"
                p={4}
              >
                <Box mb={2} sx={{ ...roboto }}>
                  Atomic Timelines
                </Box>
                <Box fontWeight="normal" fontSize="15px">
                  Atomic Timelines are horizontally scalable social timelines
                  built with Atomic Notes, distributing rewards to content
                  creators.
                </Box>
              </Box>
            </Box>
          </Flex>
          <Box flex={1} />
          <Flex justify="center" py={6}>
            <Flex w="100%" maxW="854px" align="center">
              <Link
                to="https://github.com/weavedb/atomic-notes"
                target="_blank"
              >
                <Image
                  src="./github.svg"
                  boxSize="24px"
                  sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
                />
              </Link>
              <Link to="https://x.com/atomic_notes" target="_blank">
                <Flex p="2px" ml={2} align="center">
                  <Image
                    src="./x.svg"
                    boxSize="20px"
                    sx={{ cursor: "pointer", ":hover": { opacity: 0.75 } }}
                  />
                </Flex>
              </Link>
              <Box flex={1} />
              <Flex justify="flex-end" fontSize="12px">
                ONLY POSSIBLE ON ⓐ ARWEAVE
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

export default App
