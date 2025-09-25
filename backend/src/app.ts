import { PrismaClient } from '@prisma/client'
import express, { Request, Response } from 'express'

export const createApp = (testPrisma?: any) => {
  const prisma = testPrisma || new PrismaClient()
  const app = express()
  app.use(express.json())

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    next()
  })

  app.post('/', async (req: Request, res: Response) => {
    res.json({ message: 'Hello World!' })
  })

  app.post('/leads', async (req: Request, res: Response) => {
    //get name and email from the request body
    const { name, email } = req.body
    const lead = await prisma.lead.create({
      data: {
        firstName: String(name),
        email: String(email),
      },
    })
    res.json(lead)
  })

  app.get('/leads/:id', async (req: Request, res: Response) => {
    const { id } = req.params
    const lead = await prisma.lead.findUnique({
      where: {
        id: Number(id),
      },
    })
    res.json(lead)
  })

  app.get('/leads', async (req: Request, res: Response) => {
    const leads = await prisma.lead.findMany()
    res.json(leads)
  })

  app.patch('/leads/:id', async (req: Request, res: Response) => {
    const { id } = req.params
    const { name, email } = req.body
    const lead = await prisma.lead.update({
      where: {
        id: Number(id),
      },
      data: {
        firstName: String(name),
        email: String(email),
      },
    })
    res.json(lead)
  })

  app.delete('/leads/:id', async (req: Request, res: Response) => {
    const { id } = req.params
    await prisma.lead.delete({
      where: {
        id: Number(id),
      },
    })
    res.json()
  })

  app.post('/leads/bulk-delete', async (req: Request, res: Response) => {
    try {
      const { leadIds } = req.body

      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          details: 'leadIds must be a non-empty array of numbers'
        })
      }

      const validIds = leadIds.filter(id => typeof id === 'number' && id > 0 && Number.isInteger(id))
      if (validIds.length !== leadIds.length) {
        return res.status(400).json({
          error: 'Invalid lead IDs',
          details: 'All leadIds must be positive numbers'
        })
      }

      const deleteResult = await prisma.lead.deleteMany({
        where: {
          id: {
            in: validIds,
          },
        },
      })

      res.status(200).json({
        deletedCount: deleteResult.count,
        message: `Successfully deleted ${deleteResult.count} lead(s)`
      })
    } catch (error) {
      console.error('Bulk delete error:', error)
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to delete leads'
      })
    }
  })

  app.post('/leads/generate-messages', async (req: Request, res: Response) => {
    try {
      const { template, leadIds } = req.body

      if (!template || typeof template !== 'string') {
        return res.status(400).json({
          error: 'Invalid request',
          details: 'template must be a non-empty string'
        })
      }

      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          details: 'leadIds must be a non-empty array of numbers'
        })
      }

      const validIds = leadIds.filter(id => typeof id === 'number' && id > 0 && Number.isInteger(id))
      if (validIds.length !== leadIds.length) {
        return res.status(400).json({
          error: 'Invalid lead IDs',
          details: 'All leadIds must be positive numbers'
        })
      }

      // Define valid field names from lead model
      const validFields = new Set(['firstName', 'lastName', 'email', 'jobTitle', 'countryCode', 'companyName', 'message'])
      
      // Extract field names from template using regex
      const fieldPattern = /\{(\w+)\}/g
      const requiredFields = new Set<string>()
      let match
      while ((match = fieldPattern.exec(template)) !== null) {
        requiredFields.add(match[1])
      }
      
      // Check for invalid field names
      const invalidFields = Array.from(requiredFields).filter(field => !validFields.has(field))
      if (invalidFields.length > 0) {
        return res.status(400).json({
          error: 'Invalid template fields',
          details: `Field${invalidFields.length > 1 ? 's' : ''} not available: ${invalidFields.join(', ')}. Valid fields are: ${Array.from(validFields).join(', ')}`
        })
      }

      // Fetch leads from database
      const leads = await prisma.lead.findMany({
        where: {
          id: {
            in: validIds,
          },
        },
      })

      const results = []

      for (const leadId of validIds) {
        const lead = leads.find((l: any) => l.id === leadId)
        
        if (!lead) {
          results.push({
            leadId,
            success: false,
            error: 'Lead not found'
          })
          continue
        }

        // Check if lead has all required fields
        const missingFields = []
        for (const fieldName of requiredFields) {
          const fieldValue = (lead as any)[fieldName]
          if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
            missingFields.push(fieldName)
          }
        }

        if (missingFields.length > 0) {
          results.push({
            leadId,
            success: false,
            error: `Missing field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`
          })
          continue
        }

        // Replace template placeholders with actual values
        let message = template
        for (const fieldName of requiredFields) {
          const fieldValue = (lead as any)[fieldName]
          message = message.replace(new RegExp(`\\{${fieldName}\\}`, 'g'), fieldValue)
        }

        // Update lead with generated message
        await prisma.lead.update({
          where: { id: leadId },
          data: { message }
        })

        results.push({
          leadId,
          success: true,
          message
        })
      }

      res.status(200).json({ results })
    } catch (error) {
      console.error('Generate messages error:', error)
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to generate messages'
      })
    }
  })

  app.post('/leads/guess-gender', async (req: Request, res: Response) => {
    try {
      const { leadIds } = req.body

      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          details: 'leadIds must be a non-empty array of numbers'
        })
      }

      const validIds = leadIds.filter(id => typeof id === 'number' && id > 0 && Number.isInteger(id))
      if (validIds.length !== leadIds.length) {
        return res.status(400).json({
          error: 'Invalid lead IDs',
          details: 'All leadIds must be positive numbers'
        })
      }

      // Fetch leads from database
      const leads = await prisma.lead.findMany({
        where: {
          id: {
            in: validIds,
          },
        },
      })

      const results: Array<{
        leadId: number
        success: boolean
        gender?: string
        probability?: number
        error?: string
      }> = []

      // Process leads in batches of 10 for genderize.io API
      const batchSize = 10
      for (let i = 0; i < validIds.length; i += batchSize) {
        const batchLeadIds = validIds.slice(i, i + batchSize)
        const batchLeads = batchLeadIds.map(id => leads.find((l: any) => l.id === id)).filter(Boolean)

        // Prepare batch request for genderize.io
        const namesForApi = batchLeads
          .filter(lead => lead?.firstName && lead.firstName.trim())
          .map((lead, index) => ({ name: lead!.firstName.trim(), leadId: lead!.id }))

        if (namesForApi.length > 0) {
          try {
            // Build query string for batch request
            const queryParams = namesForApi.map(item => `name[]=${encodeURIComponent(item.name)}`).join('&')
            const apiUrl = `https://api.genderize.io?${queryParams}`

            const response = await fetch(apiUrl)
            
            if (!response.ok) {
              throw new Error(`Genderize API error: ${response.status}`)
            }

            const genderData = await response.json()
            const genderResults = Array.isArray(genderData) ? genderData : [genderData]

            // Process API results and update database
            for (let j = 0; j < genderResults.length; j++) {
              const result = genderResults[j]
              const correspondingItem = namesForApi[j]
              
              if (result && result.gender && correspondingItem) {
                // Update lead in database with gender prediction
                await prisma.lead.update({
                  where: { id: correspondingItem.leadId },
                  data: { gender: result.gender }
                })

                results.push({
                  leadId: correspondingItem.leadId,
                  success: true,
                  gender: result.gender,
                  probability: result.probability
                })
              } else {
                results.push({
                  leadId: correspondingItem?.leadId || 0,
                  success: false,
                  error: 'No gender prediction available'
                })
              }
            }
          } catch (error) {
            console.error('Genderize API error:', error)
            // Add failed results for this batch
            namesForApi.forEach(item => {
              results.push({
                leadId: item.leadId,
                success: false,
                error: 'Gender prediction service unavailable'
              })
            })
          }
        }

        // Handle leads without firstName or empty firstName
        batchLeadIds.forEach(leadId => {
          const lead = leads.find((l: any) => l.id === leadId)
          const hasResult = results.some(r => r.leadId === leadId)
          
          if (!hasResult) {
            if (!lead) {
              results.push({
                leadId,
                success: false,
                error: 'Lead not found'
              })
            } else if (!lead.firstName || !lead.firstName.trim()) {
              results.push({
                leadId,
                success: false,
                error: 'Missing firstName'
              })
            }
          }
        })
      }

      // Sort results by leadId to maintain order
      results.sort((a, b) => a.leadId - b.leadId)

      res.status(200).json({ results })
    } catch (error) {
      console.error('Guess gender error:', error)
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to guess gender'
      })
    }
  })

  return app
}